import { Clock, Pencil } from 'lucide-preact';
import { ComponentChild, FunctionalComponent } from 'preact';

export type TimelineEvent = {
    content: ComponentChild;
    key: any;
    icon: FunctionalComponent<{ width: number; height: number; }>;
    date: Date;
    onClick: () => void;
    selected: boolean;
};

export default function Timeline(props: { events: TimelineEvent[] }) {
    return (
        <div className="w-[20vw] min-[1500px]:w-[22vw] min-[1800px]:w-[25vw] mx-auto p-3 flex flex-col h-[min(96,60vh)] md:h-[min(600px,60vh)] overflow-y-scroll">
            <div className="relative">
                {/* Main vertical line */}
                <div className="absolute left-6 mb-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600"></div>

                {props.events.map((event, index) => (
                    <div key={event.key} className="relative flex items-start mb-8 group">
                        {/* Timeline dot with icon */}
                        <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 shadow-lg group-hover:scale-110`}>
                            <event.icon width={30} height={30} />
                        </div>

                        {/* Content */}
                        <div onClick={event.onClick} className={`cursor-pointer ml-6 flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border group-hover:shadow-lg
                            ${event.selected ? 'border-purple-400 dark:border-purple-600' : 'border-gray-100 dark:border-gray-500 hover:border-gray-400'}`}>
                            <p className="text-gray-600 dark:text-gray-200 mb-4 leading-relaxed">
                                {event.content}
                            </p>

                            <div className="text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{event.date.toLocaleString()}</span>
                                </div>

                            </div>
                        </div>

                        {/* Connecting line to next item */}
                        {index < props.events.length - 1 && (
                            <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200 dark:bg-gray-600"></div>
                        )}
                    </div>
                ))}

                <div className="relative flex items-start group">
                    <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 shadow-lg group-hover:scale-110`}>
                        <Pencil width={18} height={18} />
                    </div>

                    <div className="ml-6 flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-gray-500 group-hover:shadow-lg">
                        <p className="text-gray-600 dark:text-gray-200 leading-relaxed">
                            Start of writer
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
