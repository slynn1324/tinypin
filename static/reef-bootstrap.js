const app = new Proxy(new function(){
    const _setters = {};
    const _getters = {};
    const _components = {};
    let frozen = false;

    this.addSetter = (name, f) => {
        if ( frozen ){
            console.error(`actions are frozen, add setter '${name}' before init.`);
        }
        if ( _setters[name] ){
            console.error(`setter ${name} is already defined.`);
        } else {
            _setters[name] = f;
        }
    }

    this.addGetter = (name, f) => {
        if ( frozen ){
            console.error(`actions are frozen, add getter '${name}' before init.`);
        }
        if (_getters[name] ){
            console.error(`getter ${name} is already defined.`);
        } else {
            _getters[name] = f;
        }
    }

    this.addComponent = (name, f) => {
        if ( frozen ){
            throw(new Error(`context is frozen, add component '${name}' components before init`));
        }
        _components[name] = f;
    }

    this.getSetters = () => {
        return _setters;
    }

    this.getGetters = () => {
        return _getters;
    }

    this.getComponents = () => {
        return _components;
    }

    this.freeze = () => {
        frozen = true;
    }
}, {
    get(target, name, receiver){
        return Reflect.get(target, name, receiver);
    },
    set(target, name, receiver){
        console.error("Direct modification of setters is not allowed.  Use setters.do(name, function) instead.");
    }
});