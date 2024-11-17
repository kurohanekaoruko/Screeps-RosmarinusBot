interface Memory {
    // 关键Memory
    RosmarinusBot: any;
}

interface BotMemory {
    rooms: {
        [roomName: string]: {
            [key: string]: any
        };
    },
    structures: {
        [roomName: string]: {
            [key: string]: any
        };
    },
    layoutMemory: {
        [roomName: string]: {
            [key: string]: any
        };
    },
    autoMarket: {
        [roomName: string]: [
            {
                type: string,
                amount: number,
                price: number,
            }
        ];
    },
    autoSend: {
        [roomName: string]: any;
    },
}