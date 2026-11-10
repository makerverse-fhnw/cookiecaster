export default class Edge {
    /**
     *
     * @param {*} id
     * @param {Node} from
     * @param {Node} to
     * @param {*} q
     * @param {number} q.x
     * @param {number} q.y
     */
    constructor(id, from, to, q = undefined) {
        if(from === to) throw new Error(`From and to (${from}) are identical `);
        this.id = id;
        this.from = from;
        this.to = to;
        /**
         * @type {{x: number, y: number}}
         */
        this.q = q !== undefined ? q : {
            x: (from.pos.x + to.pos.x) * 0.5,
            y: (from.pos.y + to.pos.y) * 0.5
        };

        from.registerAdjacentEdge(this);
        to.registerAdjacentEdge(this);
    }

    removeFromAdjacentNode() {
        this.from.unregisterAdjacentEdge(this);
        this.to.unregisterAdjacentEdge(this);
    };

    getOtherNode(node) {
        return this.from === node ? this.to : this.to === node ? this.from : undefined;
    }

    asSvgPath() {
        return `M ${this.from.pos.x} ${this.from.pos.y} Q ${this.q.x} ${this.q.y} ${this.to.pos.x} ${this.to.pos.y}`;
    }
}