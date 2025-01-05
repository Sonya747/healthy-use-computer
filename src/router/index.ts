import { RouteProps, RouterProps } from 'react-router';

/* 
interface RouterProps {
    basename?: string;
    children?: React.ReactNode;
    location: Partial<Location> | string;
    navigationType?: Action;
    navigator: Navigator;
    static?: boolean;
} */
interface RouterObject extends RouterProps{
    icon?:React.ReactNode,
    
}
// const routes: RouteProps[] = [
//     { path: '/home', <Navigate}
// ]