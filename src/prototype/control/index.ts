import base from './base';
import room from './room';
import outmine from './function/outmine';
import layout from './function/layout';
import market from './function/market';
import spawn from './structure/spawn';
import terminal from './structure/terminal';
import lab from './structure/lab';
import factory from './structure/factory';
import powerspawn from './structure/powerspawn';
import nuker from './structure/nuker';




const plugins = [
    base,
    room,
    layout,
    market,
    outmine,
    spawn,
    terminal,
    lab,
    factory,
    powerspawn,
    nuker,
]

export default () => plugins.forEach(plugin => _.assign(global, plugin));
