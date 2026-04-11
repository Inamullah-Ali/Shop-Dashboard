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

export function DeleteDialogue() {
  return (
    <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="cursor-pointer hover:bg-muted">
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Shop Name</DialogTitle>
            <DialogDescription>
                Are you sure you want to delete this shop? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button className="cursor-pointer" variant="outline">Cancel</Button>
            </DialogClose>
            <Button className="bg-red-500 cursor-pointer" type="submit">Delete</Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}
