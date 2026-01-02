import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConnection, Connection } from "@/contexts/ConnectionContext";
import { Pencil } from "lucide-react";

type Props = {
    show: boolean;
    setShow: (show: boolean) => void;
    connection: Connection | null;
};

const EditConnectionNameDialog: React.FC<Props> = ({ show, setShow, connection }) => {
    const { updateConnectionName } = useConnection();
    const [newName, setNewName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (show && connection) {
            setNewName(connection.custom_name || connection.name);
        }
    }, [show, connection]);

    const handleSave = async () => {
        if (!connection || !newName.trim()) return;
        
        setIsSaving(true);
        await updateConnectionName(connection.id, newName.trim());
        setIsSaving(false);
        setShow(false);
    };

    return (
        <Dialog open={show} onOpenChange={setShow}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="h-5 w-5 text-primary" />
                        Edit Contact Name
                    </DialogTitle>
                    <DialogDescription>
                        Change how this contact appears in your list
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Label htmlFor="contact-name" className="text-sm text-muted-foreground mb-2 block">
                        Display Name
                    </Label>
                    <Input
                        id="contact-name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter name"
                        maxLength={50}
                    />
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setShow(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!newName.trim() || isSaving}>
                        {isSaving ? "Saving..." : "Save Name"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditConnectionNameDialog;
