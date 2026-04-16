import { useState } from "react";
import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteProductDialogueProps = {
  productName: string;
  onDelete: () => void;
};

export function DeleteProductDialogue({ productName, onDelete }: DeleteProductDialogueProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer">
          <Trash2Icon className="size-4 text-red-500" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete {productName}?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. The product will be removed permanently.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            className="cursor-pointer bg-red-500 hover:bg-red-600"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
