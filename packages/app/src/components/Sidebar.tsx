import { useComputed, useSignal } from '@preact/signals';
import { PanelLeftOpen } from 'lucide-preact';
import { ComponentChild } from 'preact';

export default function Sidebar(props: { children: ComponentChild, displayFloatingToggle?: boolean }) {
    const sidebarToggle = useSignal(false);
    const wrapperClass = useComputed(() => sidebarToggle.value ? '' : 'hidden lg:flex');

    return <>
        {props.displayFloatingToggle && <div class="lg:hidden fixed z-10 cursor-pointer" onClick={() => sidebarToggle.value = true}>
            <div class="absolute w-16 h-12 bg-purple-400 dark:bg-slate-700 border-none">
                <div class="h-full flex items-center justify-center text-white font-bold">
                    <PanelLeftOpen />
                </div>
                <div class="absolute left-16 right-0 bottom-0 w-0 h-0 border-l-64 border-b-48 border-transparent border-l-purple-400 dark:border-l-slate-700"></div>
            </div>
        </div>}

        <span class={wrapperClass}>
            {/*Small screen overlay*/}
            <div class="lg:hidden fixed inset-0 bg-black opacity-50 z-20" onClick={() => sidebarToggle.value = false} />

            <div className={`flex fixed lg:relative z-30 w-64 h-dvh flex-col border-r 
            bg-white border-gray-200
            dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-800 dark:border-gray-700
        `}>
                {props.children}
            </div>
        </span>
    </>
};