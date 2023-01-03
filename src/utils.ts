import { Bot } from "mineflayer";

import { promisify } from "util";

export type AFKConstructor<T> = new (bot: Bot, ...any: any[]) => T


export const sleep = promisify(setTimeout);


/**
* Performs a deep merge of objects and returns new object. Does not modify
* objects (immutable) and merges arrays via concatenation.
*
* @param {...object} objects - Objects to merge
* @returns {object} New object with merged key/values
*/
export function mergeDeepNoArrayConcat(...objects: any[]) {
    const isObject = (obj: any) => obj && typeof obj === 'object';

    return objects.reduce((prev, obj) => {
        Object.keys(obj).forEach(key => {
            const pVal = prev[key];
            const oVal = obj[key];

            if (Array.isArray(pVal) && Array.isArray(oVal)) {
                prev[key] = oVal//pVal.concat(...oVal);
            }
            else if (isObject(pVal) && isObject(oVal)) {
                prev[key] = mergeDeepNoArrayConcat(pVal, oVal);
            }
            else {
                prev[key] = oVal;
            }
        });

        return prev;
    }, {});
}

// /**
//  * Scuffed solution to have a more robust "await this.bot.pathfinder.goto(goal)".
//  * I've had issues w/ above.
//  * @param bot Bot to perform pathfinding on
//  * @param bl Block to pathfind to STAND ON TOP OF.
//  * @param timeout timeout until failure.
//  * @returns promise of whether or not reached goal.
//  */
// export const robustGoto: (bot: Bot, pos: Vec3, timeout: number) => Promise<Vec3> = async (bot: Bot, pos: Vec3, timeout: number) => {
//     return await new Promise((res, rej) => {
//         let listener = () => res(pos);
//         let rejector = () => {
//             let goal = bot.pathfinder.goal as any;
//             if (bot.pathfinder.isMoving() && goal?.x == pos.x && goal?.y == pos.y && goal?.z == pos.z) bot.pathfinder.stop();
//             bot.off("goal_reached", listener); // no mem leak
//             rej(pos)
//         }
//         bot.pathfinder.setGoal(new goals.GoalGetToBlock(pos.x, pos.y, pos.z))
//         bot.on("goal_reached", listener);
//         (bot as any).once("goal_moved", rejector);
//         setTimeout(rejector, timeout);
//     })
// }