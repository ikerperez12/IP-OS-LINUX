import { useState, useEffect } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useOS, useWindows } from '@/hooks/useOSStore';
import { useFileSystem } from '@/hooks/useFileSystem';
import SystemIcon from '@/components/SystemIcon';
import { Search } from 'lucide-react';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const { state } = useOS();
  const { openWindow } = useWindows();
  const { fs } = useFileSystem();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName || '')) {
        return;
      }
      // Toggle on Alt+Space or Cmd/Ctrl+K
      if ((e.key === ' ' && e.altKey) || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleOpenApp = (appId: string) => {
    openWindow(appId);
    setOpen(false);
  };

  const handleOpenFile = (nodeId: string, appId: string) => {
    // We would need to open the app with the specific file, 
    // for now we just open the associated app.
    openWindow(appId);
    setOpen(false);
  };

  // Convert FileSystem nodes to an array of files
  const files = Object.values(fs.nodes).filter(n => n.type === 'file');

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Applications">
          {state.apps.filter((app) => !state.disabledAppIds.includes(app.id)).map((app) => (
            <CommandItem
              key={app.id}
              onSelect={() => handleOpenApp(app.id)}
              className="gap-2 cursor-pointer"
            >
              <SystemIcon name={app.icon} appId={app.id} size={16} />
              <span>{app.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {files.length > 0 && (
          <CommandGroup heading="Files">
            {files.slice(0, 10).map((file) => {
              // Get association for the icon
              return (
                <CommandItem
                  key={file.id}
                  onSelect={() => handleOpenFile(file.id, 'texteditor')} // fallback to texteditor or use actual association
                  className="gap-2 cursor-pointer"
                >
                  <Search size={16} className="text-muted-foreground" />
                  <span>{file.name}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

      </CommandList>
    </CommandDialog>
  );
}
