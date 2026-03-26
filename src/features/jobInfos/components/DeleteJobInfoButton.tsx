"use client"

import { Button } from "@/components/ui/button"
import { TrashIcon } from "lucide-react"
import { useTransition } from "react"
import { deleteJobInfo } from "../action"

export function DeleteJobInfoButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition()

    const handleDeleteJobInfo = () => {
        if (confirm("Are you sure you want to delete this job description?")) {
            startTransition(async () => {
                await deleteJobInfo(id)
            })
        }
    }

    return (
        <Button
            variant="destructive"
            onClick={handleDeleteJobInfo}
            disabled={isPending}
        >
            <TrashIcon className="size-4" />
        </Button>
    )
}
