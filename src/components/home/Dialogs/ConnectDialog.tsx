import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";

const ConnectDialog = ({ show, setShow }) => (
    <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="sm:max-w-md bg-[#121A2F] border-[#232e48] text-networx-light">
            <DialogHeader>
                <DialogTitle>New Connection</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <p>New connection input goes here...</p>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShow(false)}>Cancel</Button>
                <Button onClick={() => setShow(false)}>Connect</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

export default ConnectDialog;
