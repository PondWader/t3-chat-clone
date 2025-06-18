export default function Spinner(props: { small?: boolean }) {
    return <div class="flex items-center justify-center">
        <div class={`${props.small ? 'w-[14] h-[14]' : 'w-4 h-4'} border-2 border-t-transparent rounded-full animate-spin`}></div>
    </div>

}