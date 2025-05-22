"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Inbox, RefreshCw } from "lucide-react"

interface EmptyStateProps {
    onRefresh?: () => void;
    type: "Story" | "Events"
}

export default function EmptyState({ onRefresh,type }: EmptyStateProps) {
    return (
        <>
            <div className="bg-gray-100 p-6 rounded-full mb-6">
                <Inbox className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-center">No {type === "Story" ? 'News' :'Events'} Available</h2>
            <p className="text-gray-600 text-center mb-8">
                You've viewed all the available events. Check back later for updates.
            </p>
          
        </>
    )
}

