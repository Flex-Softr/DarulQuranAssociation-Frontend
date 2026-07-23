'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import Button from '../../components/ui/Button';
import { cn } from '../../lib/utils';

type ConfirmDialogOptions = {
  title?: ReactNode;
  description?: ReactNode;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  confirmVariant?: 'danger' | 'primary';
};

type ConfirmDialogContextValue = {
  confirm: (options?: ConfirmDialogOptions) => Promise<boolean>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | undefined>(undefined);

const defaultOptions: Required<Omit<ConfirmDialogOptions, 'title' | 'description'>> & {
  title: ReactNode;
  description: ReactNode;
} = {
  title: 'Confirm deletion',
  description: 'This action cannot be undone.',
  confirmText: 'Delete',
  cancelText: 'Cancel',
  confirmVariant: 'danger',
};

type DialogState = {
  open: boolean;
  options: ConfirmDialogOptions;
  resolver?: (result: boolean) => void;
};

const initialState: DialogState = {
  open: false,
  options: defaultOptions,
};

export const useConfirmDialog = () => {
  const context = useContext(ConfirmDialogContext);

  if (!context) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
  }

  return context.confirm;
};

export default function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [dialogState, setDialogState] = useState<DialogState>(initialState);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeDialog = useCallback((result: boolean) => {
    setDialogState((current) => {
      current.resolver?.(result);
      return initialState;
    });
  }, []);

  useEffect(() => {
    if (!dialogState.open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dialogState.open, closeDialog]);

  const confirm = useCallback(
    (options?: ConfirmDialogOptions) =>
      new Promise<boolean>((resolve) => {
        setDialogState({
          open: true,
          options: {
            ...defaultOptions,
            ...options,
          },
          resolver: resolve,
        });
      }),
    [],
  );

  const dialogContent = useMemo(() => {
    if (!dialogState.open) {
      return null;
    }

    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center px-4',
          'bg-black/50 backdrop-blur-sm',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={typeof dialogState.options.title === 'string' ? dialogState.options.title : undefined}
      >
        <div className="absolute inset-0" onClick={() => closeDialog(false)} />
        <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          {dialogState.options.title && (
            <h3 className="text-xl font-semibold text-gray-900">{dialogState.options.title}</h3>
          )}
          {dialogState.options.description && (
            <p className="mt-2 text-gray-600">{dialogState.options.description}</p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => closeDialog(false)}>
              {dialogState.options.cancelText}
            </Button>
            <Button
              variant={dialogState.options.confirmVariant ?? 'danger'}
              onClick={() => closeDialog(true)}
            >
              {dialogState.options.confirmText}
            </Button>
          </div>
        </div>
      </div>
    );
  }, [closeDialog, dialogState.open, dialogState.options]);

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      {mounted && dialogState.open && createPortal(dialogContent, document.body)}
    </ConfirmDialogContext.Provider>
  );
}

