"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useCreateConnection, useValidateConnection } from "../hooks/use-connections";
import { Loader2, CheckCircle2 } from "lucide-react";

interface AddConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddConnectionModal({ isOpen, onClose }: AddConnectionModalProps) {
  const [formData, setFormData] = useState({
    institution_id: "",
    institution_name: "",
  });
  const [isValidated, setIsValidated] = useState(false);

  const createMutation = useCreateConnection();
  const validateMutation = useValidateConnection();

  const handleValidate = () => {
    if (!formData.institution_id || !formData.institution_name) return;

    validateMutation.mutate({
      institution_id: formData.institution_id,
      institution_name: formData.institution_name,
    }, {
      onSuccess: () => {
        setIsValidated(true);
      }
    });
  };

  const handleSubmit = () => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        onClose();
        setFormData({ institution_id: "", institution_name: "" });
        setIsValidated(false);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Connection</DialogTitle>
          <DialogDescription>
            Enter the details of the financial institution you want to connect.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="inst-name">Institution Name</Label>
            <Input
              id="inst-name"
              value={formData.institution_name}
              onChange={(e) => {
                setFormData({ ...formData, institution_name: e.target.value });
                setIsValidated(false);
              }}
              placeholder="e.g. Chase Bank"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="inst-id">Institution ID</Label>
            <Input
              id="inst-id"
              value={formData.institution_id}
              onChange={(e) => {
                setFormData({ ...formData, institution_id: e.target.value });
                setIsValidated(false);
              }}
              placeholder="e.g. chases_bank_us"
            />
          </div>

          {validateMutation.isPending && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating connection...
            </div>
          )}
          
          {isValidated && (
            <div className="flex items-center text-sm text-emerald-500">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Connection validated successfully
            </div>
          )}
          
          {validateMutation.isError && (
             <div className="text-sm text-red-500">
               Validation failed: {validateMutation.error.message}
             </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!isValidated ? (
             <Button 
               onClick={handleValidate} 
               disabled={!formData.institution_id || !formData.institution_name || validateMutation.isPending}
             >
               Validate
             </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
