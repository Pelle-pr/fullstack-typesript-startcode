import { IPoint } from "./IGeo"

export default interface IPosition {
    lastUpdated: Date,
    email: string,
    name: string,
    location: IPoint
}