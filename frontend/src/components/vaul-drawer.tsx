import { Drawer } from 'vaul';

export default function VaulDrawer({ children, open, onOpenChange }: { children: React.ReactNode, open: boolean, onOpenChange: (arg: boolean) => void }) {
    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange} direction="right">
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                <Drawer.Content
                    className="right-2 top-2 bottom-2 fixed z-10 outline-none w-[310px] flex"
                    // The gap between the edge of the screen and the drawer is 8px in this case.
                    style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}
                >
                    <div className="bg-zinc-50 h-full w-full grow p-5 flex flex-col rounded-[16px]">
                        <div className="max-w-md mx-auto">
                            <Drawer.Title className=" text-zinc-900 text-lg font-semibold mb-2">
                                About LocustFinder
                            </Drawer.Title>
                            {children}
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}