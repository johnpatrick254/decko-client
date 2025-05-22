'use client'
import { LogOut, Loader2 } from "lucide-react";
import { SignOutButton  as SignoutButtonWrapper} from '@clerk/nextjs'
import { useState } from "react";
import { Button } from "../ui/button";
import { useSidebar } from "../ui/sidebar";

export default function SignOutButton() {
    const [loading,setIsLoading] = useState(false)
  const {open} = useSidebar()
    const handleLoadingState = ()=>{
        setIsLoading(true)
    };

    return (
        <SignoutButtonWrapper>
            <Button
                type="submit"
                className="w-full flex gap-2 justify-start  items-center text-sm px-2 py-1.5 text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={handleLoadingState}
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                       { open &&  <span>Signing out...</span>}
                    </>
                ) : (
                    <>
                        <LogOut className=" h-4 w-4 mr-4" />
                      { open && <span>Log out</span>}
                    </>
                )}
            </Button>
        </SignoutButtonWrapper>
    );
}