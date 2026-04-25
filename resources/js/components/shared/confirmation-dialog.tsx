import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    isLoading?: boolean;
}

export function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    isLoading = false,
}: ConfirmationDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="mt-2 text-text-secondary">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-6 flex gap-2 justify-end">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={variant === 'default' ? 'bg-brand hover:bg-brand-dark' : ''}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
