export default class Node{
    /**
     *
     * @param {*} id
     * @param {*} pos - node position
     * @param {number} pos.x - node x coordinate
     * @param {number} pos.y - node y coordinate
     * @param {number} limit - maximum adjacent edges
     */
    constructor(id, pos, limit = 2) {
        this.id = id;
        this.pos = pos;
        this._limit = limit;
        /**
         *
         * @type {Edge[]}
         */
        this.adjacent = [];
    }

    /**
     * Registers an edge to this node
     * @param {Edge} edge - edge to register
     * @returns {boolean} - success
     */
    registerAdjacentEdge(edge) {
        if (this.adjacent.length >= this._limit) return false;
        this.adjacent.push(edge);
        return true;
    }

    /**
     * Unregisters an edge from this node
     * @param {Edge} edge - edge to unregister
     * @returns {boolean} - success
     */
    unregisterAdjacentEdge(edge) {
        const idx = this.adjacent.findIndex(e => e.id === edge.id);
        if (idx < 0) return false;
        this.adjacent.splice(idx, 1);
        return true;
    }

    /**
     * Returns adjacent nodes of this node
     * @returns {Node[]}
     */
    getAdjacentNodes() {
        const ans = [];
        this.adjacent.forEach(ae => {
            ans.push(ae.getOtherNode(this));
        });
        return ans;
    };
}