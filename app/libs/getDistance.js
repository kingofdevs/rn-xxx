class Distance {
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    calc(from, to) {
        const lat1 = parseFloat(from.latitude);
        const lon1 = parseFloat(from.longitude);
        const lat2 = parseFloat(to.latitude);
        const lon2 = parseFloat(to.longitude);

        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1); // deg2rad below
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }
    
    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
}
    
export default new Distance();