import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, } from "lucide-react"
import { useState } from "react";

type Props = {
  rowData: {
    id: number;
    appwriteDocumentId?: string;
    shopName: string;
  };
  onDeletePlan: (rowData: { id: number; appwriteDocumentId?: string; shopName: string }) => void | Promise<void>;
};

export function DeletePlan({ rowData, onDeletePlan }: Props) {
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    await onDeletePlan(rowData);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="cursor-pointer hover:bg-muted">
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {rowData.shopName}?</DialogTitle>
            <DialogDescription>
                Are you sure you want to delete this plan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button className="cursor-pointer" variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              className="bg-red-500 cursor-pointer"
              type="button"
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}
