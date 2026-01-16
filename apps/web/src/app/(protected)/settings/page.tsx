"use client";

import { ProfileForm } from "@/features/settings/components/profile-form";
import { PreferenceForm } from "@/features/settings/components/preference-form";
import { Separator } from "@workspace/ui/components/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

export default function SettingsPage() {
  return (
    <div className="space-y-6 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div>
        <h3 className="text-2xl font-bold font-sans tracking-tight">Settings</h3>
        <p className="text-muted-foreground mb-6">Manage your account settings and preferences.</p>
      </div>
      <Separator className="bg-border/50" />

      <Tabs defaultValue="profile" className="flex-1 mt-6">
        <TabsList className="bg-muted/10 border border-border/10">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="max-w-xl">
          <div className="glass-card p-6">
            <ProfileForm />
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="max-w-xl">
          <div className="glass-card p-6">
            <PreferenceForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
