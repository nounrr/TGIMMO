import { useEffect, useMemo, useState } from 'react';
import { 
  useCreateRoleMutation, 
  useUpdateRoleMutation, 
  useGetPermissionsQuery,
  useSyncRolePermissionsMutation
} from '../../features/roles/rolesApi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function RoleFormModalShadcn({ show, onHide, role }) {
  const isEdit = !!role?.id;
  const [name, setName] = useState(role?.name || '');
  const [selectedPermissions, setSelectedPermissions] = useState(role?.permissions?.map(p => p.name) || []);

  const { data: permissionsResp, isLoading: isLoadingPerms } = useGetPermissionsQuery({ per_page: 200, q: '' }, { skip: !show });
  const permissions = useMemo(() => permissionsResp?.data || [], [permissionsResp?.data]);

  const groupedPermissions = useMemo(() => {
    const groups = {};
    permissions.forEach(perm => {
      const parts = perm.name.split('.');
      const groupName = parts.length > 1 ? parts[0] : 'Autres';
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(perm);
    });
    return groups;
  }, [permissions]);

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [syncPerms, { isLoading: isSyncing }] = useSyncRolePermissionsMutation();

  useEffect(() => {
    if (show) {
      setName(role?.name || '');
      setSelectedPermissions(role?.permissions?.map(p => p.name) || []);
    }
  }, [show, role]);

  const handleTogglePermission = (permName) => {
    setSelectedPermissions((prev) =>
      prev.includes(permName) ? prev.filter((p) => p !== permName) : [...prev, permName]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateRole({ id: role.id, name }).unwrap();
        await syncPerms({ id: role.id, permissions: selectedPermissions }).unwrap();
      } else {
        await createRole({ name, permissions: selectedPermissions }).unwrap();
      }
      onHide?.();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du rôle:', err);
    }
  };

  const busy = isCreating || isUpdating || isSyncing;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le rôle' : 'Nouveau rôle'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Modifiez les informations du rôle' : 'Créez un nouveau rôle et attribuez des permissions'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">Nom du rôle</Label>
            <Input
              id="role-name"
              placeholder="Ex: admin, gestionnaire"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Permissions</Label>
              <span className="text-sm text-muted-foreground">
                {selectedPermissions.length} sélectionnée(s)
              </span>
            </div>
            
            <div className="border rounded-lg p-4 bg-slate-50">
              {isLoadingPerms ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement des permissions...
                </div>
              ) : permissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune permission trouvée.
                </div>
              ) : (
                <ScrollArea className="h-72">
                  <div className="space-y-2 pr-4">
                    {Object.entries(groupedPermissions).map(([group, perms]) => (
                      <Collapsible key={group} className="border rounded-md bg-white">
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 font-medium hover:bg-slate-50 [&[data-state=open]>svg]:rotate-180">
                          <div className="flex items-center gap-2">
                             <span className="capitalize">{group.replace(/-/g, ' ')}</span>
                             <Badge variant="outline" className="ml-2 bg-indigo-50 text-indigo-700 border-indigo-200">{perms.length}</Badge>
                          </div>
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-3 pt-0 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            {perms.map((perm) => {
                              const checked = selectedPermissions.includes(perm.name);
                              return (
                                <div key={perm.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`perm-${perm.id}`}
                                    checked={checked}
                                    onCheckedChange={() => handleTogglePermission(perm.name)}
                                  />
                                  <Label 
                                    htmlFor={`perm-${perm.id}`} 
                                    className="text-sm cursor-pointer flex-1"
                                  >
                                    {perm.name}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onHide} 
              disabled={busy}
              className="w-full md:w-1/2"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={busy}
              className="w-full md:w-1/2"
            >
              {busy ? 'Enregistrement...' : (isEdit ? 'Enregistrer' : 'Créer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
