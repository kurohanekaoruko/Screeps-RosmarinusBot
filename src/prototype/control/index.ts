import base from './base';
import helpExtension from './help';
import terminalExtension from './terminal';
import roomExtension from './room';


const plugins = [
    base,
    helpExtension,
    terminalExtension,
    roomExtension,
]

export default () => plugins.forEach(plugin => _.assign(global, plugin));
