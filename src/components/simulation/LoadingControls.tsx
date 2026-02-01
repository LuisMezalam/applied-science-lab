import { motion } from 'framer-motion';
import { LoadingProfile, LoadingParams, DomainType } from '@/types/physics';
import { loadingProfiles, profilesByDomain } from '@/lib/physics/loadingProfiles';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Beaker, Flame, Droplets, Building2 } from 'lucide-react';

interface LoadingControlsProps {
  selectedProfile: LoadingProfile;
  params: LoadingParams;
  onProfileChange: (profile: LoadingProfile) => void;
  onParamsChange: (params: LoadingParams) => void;
  activeDomain: DomainType;
  onDomainChange: (domain: DomainType) => void;
}

const domainIcons = {
  structures: Building2,
  heat: Flame,
  fluids: Droplets,
};

const domainColors: Record<DomainType, string> = {
  structures: 'text-structures',
  heat: 'text-heat',
  fluids: 'text-fluids',
  dynamics: 'text-primary',
  circuits: 'text-warning',
  propulsion: 'text-success',
};

export function LoadingControls({
  selectedProfile,
  params,
  onProfileChange,
  onParamsChange,
  activeDomain,
  onDomainChange,
}: LoadingControlsProps) {
  const currentProfiles = profilesByDomain[activeDomain];

  const handleSliderChange = (key: keyof LoadingParams, value: number[]) => {
    onParamsChange({ ...params, [key]: value[0] });
  };

  return (
    <div className="space-y-6">
      {/* Domain Selector */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-3 block">
          Engineering Domain
        </Label>
        <Tabs value={activeDomain} onValueChange={(v) => onDomainChange(v as DomainType)}>
          <TabsList className="grid grid-cols-3 h-auto p-1">
            {(['structures', 'heat', 'fluids'] as DomainType[]).map((domain) => {
              const Icon = domainIcons[domain];
              return (
                <TabsTrigger
                  key={domain}
                  value={domain}
                  className="flex flex-col items-center gap-1 py-2 px-3 data-[state=active]:bg-primary/20"
                >
                  <Icon className={`h-4 w-4 ${domainColors[domain]}`} />
                  <span className="text-xs capitalize">{domain}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Loading Profile Selector */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-3 block">
          Loading Profile
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {currentProfiles.map((profile) => (
            <Button
              key={profile.id}
              variant={selectedProfile.id === profile.id ? 'default' : 'outline'}
              size="sm"
              className="h-auto py-2 px-3 justify-start text-left"
              onClick={() => {
                onProfileChange(profile);
                onParamsChange(profile.defaultParams);
              }}
            >
              <span className="truncate text-xs">{profile.name}</span>
            </Button>
          ))}
        </div>
        {selectedProfile && (
          <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/30 rounded">
            {selectedProfile.description}
          </p>
        )}
      </div>

      {/* Parameter Controls */}
      <div className="space-y-4">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide block">
          Parameters
        </Label>

        {/* Magnitude */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm">Magnitude</Label>
            <span className="font-mono text-sm text-primary">{params.magnitude.toFixed(1)}</span>
          </div>
          <Slider
            value={[params.magnitude]}
            onValueChange={(v) => handleSliderChange('magnitude', v)}
            min={0.1}
            max={50}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Length */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm">Domain Length</Label>
            <span className="font-mono text-sm text-primary">{params.length.toFixed(1)}</span>
          </div>
          <Slider
            value={[params.length]}
            onValueChange={(v) => handleSliderChange('length', v)}
            min={1}
            max={20}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Position (if applicable) */}
        {params.position !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Position</Label>
              <span className="font-mono text-sm text-primary">{params.position.toFixed(2)}</span>
            </div>
            <Slider
              value={[params.position]}
              onValueChange={(v) => handleSliderChange('position', v)}
              min={0}
              max={params.length}
              step={0.1}
              className="w-full"
            />
          </div>
        )}

        {/* Width (if applicable) */}
        {params.width !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Width / Spread</Label>
              <span className="font-mono text-sm text-primary">{params.width.toFixed(2)}</span>
            </div>
            <Slider
              value={[params.width]}
              onValueChange={(v) => handleSliderChange('width', v)}
              min={0.1}
              max={params.length / 2}
              step={0.05}
              className="w-full"
            />
          </div>
        )}

        {/* Start/End Magnitude for trapezoidal */}
        {params.startMagnitude !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Start Magnitude</Label>
              <span className="font-mono text-sm text-primary">{params.startMagnitude.toFixed(1)}</span>
            </div>
            <Slider
              value={[params.startMagnitude]}
              onValueChange={(v) => handleSliderChange('startMagnitude', v)}
              min={0}
              max={params.magnitude}
              step={0.1}
              className="w-full"
            />
          </div>
        )}

        {params.endMagnitude !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">End Magnitude</Label>
              <span className="font-mono text-sm text-primary">{params.endMagnitude.toFixed(1)}</span>
            </div>
            <Slider
              value={[params.endMagnitude]}
              onValueChange={(v) => handleSliderChange('endMagnitude', v)}
              min={0}
              max={params.magnitude * 1.5}
              step={0.1}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
