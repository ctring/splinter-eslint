class Repository<T> {
    findOneBy(query: Partial<T>) {
        return query;
    }
}
class User {}
class Wrapper {
    repository: Repository<User>;
    constructor() {
        this.repository = new Repository<User>();
    }
}
new Wrapper().repository.findOneBy({
    name: "John",
    age: 18,
    "address": {
        "street": "Main Street",
        "city": "New York"  
    },
    ...{
        "occupation": "Developer"
    }
});
