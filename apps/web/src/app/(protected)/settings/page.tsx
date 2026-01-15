"use client";

import { ProfileForm } from "@/features/settings/components/profile-form";
import { PreferenceForm } from "@/features/settings/components/preference-form";
import { Separator } from "@workspace/ui/components/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

export default function SettingsPage() {
  return (
    <div className="space-y-6 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div>
        <h3 className="text-lg font-medium">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <Separator />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="max-w-xl">
          <ProfileForm />
        </TabsContent>

        <TabsContent value="preferences" className="max-w-xl">
          <PreferenceForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
