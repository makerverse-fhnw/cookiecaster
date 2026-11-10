export class Vec2 {
    constructor(x, y) {
        this._x = x;
        this._y = y;
    }

    static ZERO = new Vec2(0, 0);
    static ONE = new Vec2(1, 1);
    static UNIT_X = new Vec2(1, 0);
    static UNIT_Y = new Vec2(0, 1);

    get x() {return this._x;}
    get y() {return this._y;}

    add(vec) {
        return new Vec2(
            this._x + vec.x,
            this._y + vec.y
        );
    }

    sub(vec) {
        return new Vec2(
            this._x - vec.x,
            this._y - vec.y
        );
    }

    scale(s) {
        return new Vec2(
            this._x * s,
            this._y * s
        );
    }

    cross(vec) {
        return this._x * vec.y - this._y * vec.x;
    }

    dot(vec) {
        return this._x * vec.x + this._y * vec.y;
    }

    lengthSquared() {
        return this._x * this._x + this._y * this._y;
    }

    length() {
        return Math.sqrt(this.lengthSquared());
    }

    normalize() {
        return this.scale(1 / this.length())
    }

    toVec3(z = 0) {
        return new Vec3(this._x, this._y, z);
    }
}

export class Vec3 {
    constructor(x, y, z) {
        this._x = x;
        this._y = y;
        this._z = z;
    }

    static ZERO = new Vec3(0, 0, 0);
    static ONE = new Vec3(1, 1, 1);
    static UNIT_X = new Vec3(1, 0, 0);
    static UNIT_Y = new Vec3(0, 1, 0);
    static UNIT_Z = new Vec3(0, 0, 1);

    get x() {return this._x;}
    get y() {return this._y;}
    get z() {return this._z;}

    add(vec) {
        return new Vec3(
            this._x + vec.x,
            this._y + vec.y,
            this._z + vec.z
        );
    }

    sub(vec) {
        return new Vec3(
            this._x - vec.x,
            this._y - vec.y,
            this._z - vec.z
        );
    }

    scale(s) {
        return new Vec3(
            this._x * s,
            this._y * s,
            this._z * s
        );
    }

    dot(vec) {
        return this._x * vec.x + this._y * vec.y + this._z * vec.z;
    }

    cross(vec) {
        return new Vec3(
            this._y * vec.z - this._z * vec.y,
            this._z * vec.x - this._x * vec.z,
            this._x * vec.y - this._y * vec.x
        );
    }

    lengthSquared() {
        return this._x * this._x + this._y * this._y + this._z * this._z;
    }

    length() {
        return Math.sqrt(this.lengthSquared());
    }

    normalize() {
        return this.scale(1 / this.length())
    }
}