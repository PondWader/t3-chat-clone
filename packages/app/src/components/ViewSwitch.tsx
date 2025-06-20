import { History, Text } from "lucide-preact";
import { ComponentChild } from "preact";

export default function ViewSwitch(props: {
    left: string;
    right: string;
    activeView: 'left' | 'right';
    onViewChange: (view: 'left' | 'right') => void;
}) {
    return (
        <div class={"relative inline-flex bg-gray-300 dark:bg-gray-700 rounded-lg p-0.5 text-sm text-black dark:text-white"}>
            <SwitchSide active={props.activeView === 'left'} name="Text" icon={<Text size={12} />} onClick={() => props.onViewChange('left')} />
            <SwitchSide active={props.activeView === 'right'} name="History" icon={<History size={12} />} onClick={() => props.onViewChange('right')} />
        </div>
    );
};


function SwitchSide(props: { name: string, active: boolean, icon: ComponentChild, onClick: () => void }) {
    return <button
        onClick={props.onClick}
        class={`
            cursor-pointer relative z-10 flex items-center gap-2 px-6 py-0.5 rounded-md font-medium transition-all duration-200
            ${props.active
                ? "bg-gray-400 dark:bg-slate-800 shadow-sm"
                : "hover:text-gray-700 dark:hover:text-gray-400"}
        `}
    >
        {props.icon}
        {props.name}
    </button>
}