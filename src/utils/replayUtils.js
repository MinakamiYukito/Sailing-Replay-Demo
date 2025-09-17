import Crosswind_Small from "../data/course/Crosswind_Small.json";
import Crosswind_Big from "../data/course/Crosswind_Big.json";
import Trapezoid_Small from "../data/course/Trapezoid_Small.json";
import Trapezoid_Big from "../data/course/Trapezoid_Big.json";
import Triangular_Small from "../data/course/Triangular_Small.json";
import Triangular_Big from "../data/course/Triangular_Big.json";
import UpDown_Small from "../data/course/UpDown_Small.json";
import UpDown_Big from "../data/course/UpDown_Big.json";

let course_data;

export function detectDeviceCapabilities() {
    const cores = window.navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;
    return (cores >= 6 && memory >= 8) ? 'high' : 'low';
}

export const graphicsSettings = {
    high: {
    antialias: true,
    pixelRatio: window.devicePixelRatio,
    shadowMap: true,
    waterDistortion: 3,
    skyTurbidity: 10,
    },
    low: {
    antialias: true,
    pixelRatio: 0.8,
    shadowMap: false,
    waterDistortion: 0,
    skyTurbidity: 2,
    }
};


export async function importCourseData(courseDataString) {
    try {
        switch (courseDataString) {
            case "1,0": course_data = Crosswind_Small; break;
            case "1,1": course_data = Crosswind_Big; break;
            case "2,0": course_data = Trapezoid_Small; break;
            case "2,1": course_data = Trapezoid_Big; break;
            case "3,0": course_data = Triangular_Small; break;
            case "3,1": course_data = Triangular_Big; break;
            case "4,0": course_data = UpDown_Small; break;
            case "4,1": course_data = UpDown_Big; break;
            default:
                console.error("Invalid course data:", courseDataString);
                course_data = null;
    }
        return course_data;
    }   catch (e) {
        console.error(`Error importing JSON data: ${e}`);
        return null;
    }
}