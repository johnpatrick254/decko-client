import { Button } from "@/components/ui/button";
import { LucideProps } from "lucide-react";
import Link from "next/link";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export type SideBarItemProp = {
    title: string;
    Icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>,
    path: string;
}
export const SideBarItem: React.FC<SideBarItemProp> = ({ Icon, title, path }) => {
    return <Link href={path} className="">
        <Button
            variant={'ghost'}
            className="inline-flex h-10 w-full items-center justify-start whitespace-nowrap rounded-md  px-5  py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"

        >
            <Icon className="mr-2.5"   />
            {title}
        </Button>
    </Link>
}