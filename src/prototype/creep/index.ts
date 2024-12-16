import { assignPrototype } from "@/prototype/base"
import BaseFunction from "./base/baseFunction"
import MoveFunction from "./base/moveFuntion"

const plugins = [
    BaseFunction,
    MoveFunction,
]

export default () => plugins.forEach(plugin => assignPrototype(Creep, plugin))
