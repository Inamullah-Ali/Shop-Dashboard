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
import { useShopStore } from "@/store/shop-store";
import { Trash2, } from "lucide-react"
import { useState } from "react";
import { toast } from "sonner";
import type { IShop } from "@/types/tabledata";
import { purgeShopRelatedLocalData } from "@/service/shop-cascade";
import { deleteShopInAppwrite } from "@/service/appwriteShop";

type Props = {
  rowData: IShop;
};

export function DeleteDialogue({ rowData }: Props) {
  const [open, setOpen] = useState(false);
  const { deleteShop } = useShopStore();

  const handleDelete = async () => {
    try {
      const result = await deleteShopInAppwrite({
        appwriteDocumentId: rowData.appwriteDocumentId,
        appwriteUserId: rowData.appwriteUserId,
        email: rowData.email,
      });

      await purgeShopRelatedLocalData(rowData);
      deleteShop(rowData.id);
      setOpen(false);
      if (result.accountDeleted) {
        toast.success("Shop and Shop Admin account deleted.");
      } else {
        toast.success("Shop deleted. Configure Shop Admin delete endpoint to remove Appwrite user account.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete shop");
    }
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
                Are you sure you want to delete this shop? This action cannot be undone.
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
