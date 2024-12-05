
export const RESOURCE_ABBREVIATIONS = {
    // 能量
    'E': RESOURCE_ENERGY,
    'P': RESOURCE_POWER,
    // 压缩矿物
    'ubar': RESOURCE_UTRIUM_BAR,
    'lbar': RESOURCE_LEMERGIUM_BAR,
    'zbar': RESOURCE_ZYNTHIUM_BAR,
    'kbar': RESOURCE_KEANIUM_BAR,
    'gbar': RESOURCE_GHODIUM_MELT,
    'obar': RESOURCE_OXIDANT,
    'hbar': RESOURCE_REDUCTANT,
    'ox': RESOURCE_OXIDANT,
    'red': RESOURCE_REDUCTANT,
    'pur': RESOURCE_PURIFIER,
    'comp': RESOURCE_COMPOSITE,
    'cry': RESOURCE_CRYSTAL,
    'liq': RESOURCE_LIQUID,
    // 商品
    'B': RESOURCE_BATTERY,
    'sil': RESOURCE_SILICON,
    'met': RESOURCE_METAL,
    'bio': RESOURCE_BIOMASS,
    'mist': RESOURCE_MIST,
    'wire': RESOURCE_WIRE,
    'cell': RESOURCE_CELL,
    'alloy': RESOURCE_ALLOY,
    'cond': RESOURCE_CONDENSATE,
    'swit': RESOURCE_SWITCH,
    'tran': RESOURCE_TRANSISTOR,
    'micro': RESOURCE_MICROCHIP,
    'circ': RESOURCE_CIRCUIT,
    'dev': RESOURCE_DEVICE,
    'phleg': RESOURCE_PHLEGM,
    'tiss': RESOURCE_TISSUE,
    'musc': RESOURCE_MUSCLE,
    'org': RESOURCE_ORGANOID,
    'orga': RESOURCE_ORGANISM,
    'conc': RESOURCE_CONCENTRATE,
    'ext': RESOURCE_EXTRACT,
    'spir': RESOURCE_SPIRIT,
    'eman': RESOURCE_EMANATION,
    'ess': RESOURCE_ESSENCE,
}

export const t3 = ['XKH2O', 'XKHO2', 'XZH2O', 'XZHO2', 'XGH2O', 'XGHO2', 'XLHO2', 'XLH2O', 'XUH2O', 'XUHO2']
export const t2 = ['KH2O', 'KHO2', 'ZH2O', 'ZHO2', 'GH2O', 'GHO2', 'LHO2', 'LH2O', 'UH2O', 'UHO2']
export const t1 = ['KH', 'KO', 'GH', 'GO', 'LH', 'LO', 'ZO', 'ZH', 'UH', 'UO']

export const LabMap = {
    'OH': { raw1: 'H', raw2: 'O' },
    'ZK': { raw1: 'Z', raw2: 'K' },
    'UL': { raw1: 'U', raw2: 'L' },
    'G': { raw1: 'ZK', raw2: 'UL' },
    'GH': { raw1: 'G', raw2: 'H' },
    'GH2O': { raw1: 'GH', raw2: 'OH' },
    'XGH2O': { raw1: 'GH2O', raw2: 'X' },
    'ZO': { raw1: 'Z', raw2: 'O' },
    'ZHO2': { raw1: 'ZO', raw2: 'OH' },
    'XZHO2': { raw1: 'ZHO2', raw2: 'X' },
    'UH': { raw1: 'U', raw2: 'H' },
    'UH2O': { raw1: 'UH', raw2: 'OH' },
    'XUH2O': { raw1: 'UH2O', raw2: 'X' },
    'KH': { raw1: 'K', raw2: 'H' },
    'KH2O': { raw1: 'KH', raw2: 'OH' },
    'XKH2O': { raw1: 'KH2O', raw2: 'X' },
    'KO': { raw1: 'K', raw2: 'O' },
    'KHO2': { raw1: 'KO', raw2: 'OH' },
    'XKHO2': { raw1: 'KHO2', raw2: 'X' },
    'LH': { raw1: 'L', raw2: 'H' },
    'LH2O': { raw1: 'LH', raw2: 'OH' },
    'XLH2O': { raw1: 'LH2O', raw2: 'X' },
    'LO': { raw1: 'L', raw2: 'O' },
    'LHO2': { raw1: 'LO', raw2: 'OH' },
    'XLHO2': { raw1: 'LHO2', raw2: 'X' },
    'GO': { raw1: 'G', raw2: 'O' },
    'GHO2': { raw1: 'GO', raw2: 'OH' },
    'XGHO2': { raw1: 'GHO2', raw2: 'X' },
    'ZH': { raw1: 'Z', raw2: 'H' },
    'ZH2O': { raw1: 'ZH', raw2: 'OH' },
    'XZH2O': { raw1: 'ZH2O', raw2: 'X' },
    'UO': { raw1: 'U', raw2: 'O' },
    'UHO2': { raw1: 'UO', raw2: 'OH' },
    'XUHO2': { raw1: 'UHO2', raw2: 'X' },
}

// lab合成自动优先级
export const LabLevel = {
    'ZK': 1,
    'UL': 1,

    'G': 2,

    'UH': 3,
    'UO': 3,
    'KH': 3,
    'KO': 3,
    'LH': 3,
    'LO': 3,
    'OH': 3,
    'ZO': 3,
    'ZH': 3,
    'GH': 3,
    'GO': 3,

    'LHO2': 4,
    'LH2O': 4,
    'GH2O': 4,
    'GHO2': 4,
    'KH2O': 4,
    'KHO2': 4,
    'ZH2O': 4,
    'ZHO2': 4,
    'UH2O': 4,
    'UHO2': 4,

    'XLHO2': 5,
    'XLH2O': 5,
    'XUH2O': 5,
    'XUHO2': 5,
    'XZH2O': 5,
    'XZHO2': 5,
    'XKH2O': 5,
    'XKHO2': 5,
    'XGH2O': 5,
    'XGHO2': 5,
}

export const CompoundColor = {
    'L': '#6cf0a9',
    'LH': '#6cf0a9',
    'LHO2': '#6cf0a9',
    'XLHO2': '#6cf0a9',
    'LH2O': '#6cf0a9',
    'LO': '#6cf0a9',
    'XLH2O': '#6cf0a9',
    'U': '#4ca7e5',
    'UH': '#4ca7e5',
    'UO': '#4ca7e5',
    'UH2O': '#4ca7e5',
    'UHO2': '#4ca7e5',
    'XUH2O': '#4ca7e5',
    'XUHO2': '#4ca7e5',
    'Z': '#f7d492',
    'ZO': '#f7d492',
    'ZH': '#f7d492',
    'ZH2O': '#f7d492',
    'ZHO2': '#f7d492',
    'XZH2O': '#f7d492',
    'XZHO2': '#f7d492',
    'K': '#da6Bf5',
    'KH': '#da6Bf5',
    'KO': '#da6Bf5',
    'KH2O': '#da6Bf5',
    'KHO2': '#da6Bf5',
    'XKH2O': '#da6Bf5',
    'XKHO2': '#da6Bf5',
    'G': '#d9d6c3',
    'GH': '#d9d6c3',
    'GO': '#d9d6c3',
    'GH2O': '#d9d6c3',
    'GHO2': '#d9d6c3',
    'XGH2O': '#d9d6c3',
    'XGHO2': '#d9d6c3',
    'X': '#aa2116',
    'ZK': '#74787c',
    'UL': '#7c8577'
}

export const zipMap = {
    'energy': RESOURCE_BATTERY,
    'L': 'lemergium_bar',
    'Z': 'zynthium_bar',
    'K': 'keanium_bar',
    'U': 'utrium_bar',
    'G': 'ghodium_melt',
    'O': 'oxidant',
    'H': 'reductant',
    'X': 'purifier',
}

export const unzipMap = {
    'battery': RESOURCE_ENERGY,
    'lemergium_bar': RESOURCE_LEMERGIUM,
    'zynthium_bar': RESOURCE_ZYNTHIUM,
    'keanium_bar': RESOURCE_KEANIUM,
    'utrium_bar': RESOURCE_UTRIUM,
    'ghodium_melt': RESOURCE_GHODIUM,
    'oxidant': RESOURCE_OXYGEN,
    'reductant': RESOURCE_HYDROGEN,
    'purifier': RESOURCE_CATALYST,
}

