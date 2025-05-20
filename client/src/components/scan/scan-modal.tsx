import React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScanForm } from "./scan-form";
import { ScanFormData } from "@/lib/types";
import { ScanType } from "@shared/schema";

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScanFormData) => void;
  isLoading: boolean;
}

export function ScanModal({ isOpen, onClose, onSubmit, isLoading }: ScanModalProps) {
  const handleSubmit = (data: ScanFormData) => {
    onSubmit(data);
  };

  const defaultValues: ScanFormData = {
    targetDomain: "",
    scanType: ScanType.FULL,
    scanDepth: 3,
    saveResults: true
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white">New Scan</DialogTitle>
        </DialogHeader>
        <ScanForm 
          onSubmit={handleSubmit}
          defaultValues={defaultValues}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
