# Extending mapillary-js


One way to extend the mapillary-js functionality is through custom UIs. This short overview describes how one could extend mapillary-js to display username alongside with every photo. While this will become a native module, it’ll show how UI extensions can be done.

1. Declare the UI constructor

  ```js
  var Attribution = (function () {
    function Attribution (container, navigator) {
      this.container = container
      this.navigator = navigator
    }
    return Attribution
  }())
  ```

2. For the construct to work correctly with mapillary-js `activate` and `deactivate` methods are required. As stated with their names, these methods are called when the UI gets activated or deactivated. These are good places to do preparation for further interactions (activate) or cleanup (deactivate)

  ```js
  var Attribution = (function () {
    function Attribution (container, navigator) { /* ... */ }

    Attribution.prototype.activate = function () { }
    Attribution.prototype.deactivate = function () { }

    return Attribution
  }
  ```

3. Since we want to subscribe to event whenever the viewer changes the photo, we can subscribe to a stream in the activate function. This allows us to observe and use the data fetched from the Mapillary API for the given photo. Bear in mind, that the API for subscriptions can change, and subscribing to observables is recommended only for plugin authors. End users should use `movestart`, `nodechange` or `moveend` events to which then can subscribe through `viewerInstance.on('eventname', callbackFunction)`.

  ```js
  Attribution.prototype.activate = function () {
    this.disposable = this.navigator
      .stateService
      .currentNode
      .subscribe(callbackFunction) // function (node) { ... }
  }
  ```

4. The next step is to handle the data in some way, however we want to have some way of outputting the data from the observable, therefore we need a function that will handle container creation for us.

  ```js
  //--- Attribution constructor
  Attribution.prototype.activate = function () {
    this.setAttributionContainer()
    // ...
  }

  Attribution.prototype.setAttributionContainer = function () {
    var div = document.createElement('div')

    div.className = 'attribution'
    div.style.top = '0'
    div.style.left = '0'
    div.style.position = 'absolute'
    div.style.color = 'white'

    this.attributionContainer = div

    this.container.element.appendChild(this.attributionContainer)
  }
  ```

5. After we have a way to do the ground work, we can move onto handling the data from the overvable whenever it changes. Since we’re interesting in the username, we will write a callback function, which will get passed to an observable. Bear in mind that this function is not bound to the constructor, but still resides within it. It clears the content of the container we have set up in within the `activate` method and updates the username inside it.

  ```js
  //--- still in the Attribution constructor
  Attribution.prototype.activate = function () {
    this.disposable = this.navigator
      .stateService
      .currentNode
      .subscribe(onNodeChange.bind(this)) // `this` binds to the constructor as we
                                          // want to modify this.attributionContainer
  }

  function onNodeChange (node) {
    this.attributionContainer.innerText = node.user
  }
  ```

6. We’re almost done, next important step is to clean up. We need to unsubscribe from the observable when the UI gets deactivated.

  ```js
  Attribution.prototype.deactivate = function () {
    this.disposable.dispose()
    this.attributionContainer = undefined
  }
  ```

7. Finally, as we have a constructor ready, last thing we have to do is to make it available to be consumed by the user, all we have to do is to call the function. It adds our newly created UI constructor to `attribution` name, so we can easily call it when we initialize the viewer.

  ```js
  Mapillary.UI.add('attribution', Attribution)
  ```

8. Our extension is ready to be loaded in the html file where we use mapillary-js.

9. To activate the UI, we have to specify its name (`attribution`) when initializing the viewer, along with other UIs we want to use.

  ```js
  var mly = new Mapillary
    .Viewer('mly',
            'clientId',
            {
              key: 'RSf7Ww9YMHMndq1GEN4v0A',
              uis: ['attribution', 'simplenav', 'simple']
            })
  ```

10. Now we’re ready to enjoy the attribution next to the photo!

  > @TODO: Add photos

11. Full code looks as follows:

`attribution.js` file contents
```js
var Attribution = (function () {
  function Attribution (container, navigator) {
    this.container = container
    this.navigator = navigator
  }

  Attribution.prototype.activate = function () {
    this.setAttributionContainer()
    this.disposable = this.navigator
      .stateService
      .currentNode
      .subscribe(onNodeChange.bind(this))
  }

  Attribution.prototype.deactivate = function () {
    this.disposable.dispose()
    this.attributionContainer = undefined
  }

  function onNodeChange (node) {
    this.attributionContainer.innerText = node.user
  }

  Attribution.prototype.setAttributionContainer = function () {
    var div = document.createElement('div')

    div.className = 'attribution'
    div.style.top = '0'
    div.style.left = '0'
    div.style.position = 'absolute'
    div.style.color = 'white'

    this.attributionContainer = div

    this.container.element.appendChild(this.attributionContainer)
  }

  return Attribution
}())

Mapillary.UI.add('attribution', Attribution)
```

Assuming that `mapillary-js` and `attribution.js` are loaded beforehand and available in the global scope, this is how your `scripts.js` files could look like:

```js
var mly = new Mapillary
  .Viewer('mly',
          'clientId',
          {
            key: 'RSf7Ww9YMHMndq1GEN4v0A',
            uis: ['attribution', 'simplenav', 'simple']
          })
```

