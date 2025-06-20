import { useRef } from "preact/hooks";

export default function Gemini(props: { height: number, width: number }) {
    const id = useRef(Math.floor(Math.random() * 10e4)).current;

    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" width={props.width} height={props.height} className="inline-block">
        <path
            fill={`url(#prefix__paint0_radial_980_20147_${id})`}
            d="M16 8.016A8.52 8.52 0 0 0 8.016 16h-.032A8.52 8.52 0 0 0 0 8.016v-.032A8.52 8.52 0 0 0 7.984 0h.032A8.52 8.52 0 0 0 16 7.984z"
        ></path>
        <defs>
            <radialGradient
                id={`prefix__paint0_radial_980_20147_${id}`}
                cx="0"
                cy="0"
                r="1"
                gradientTransform="matrix(16.1326 5.4553 -43.70045 129.2322 1.588 6.503)"
                gradientUnits="userSpaceOnUse"
            >
                <stop offset="0.067" stop-color="#9168C0"></stop>
                <stop offset="0.343" stop-color="#5684D1"></stop>
                <stop offset="0.672" stop-color="#1BA1E3"></stop>
            </radialGradient>
        </defs>
    </svg>
}