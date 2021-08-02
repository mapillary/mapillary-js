"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[8245],{3905:function(e,t,a){a.d(t,{Zo:function(){return o},kt:function(){return N}});var r=a(7294);function n(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function i(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,r)}return a}function p(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?i(Object(a),!0).forEach((function(t){n(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):i(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function l(e,t){if(null==e)return{};var a,r,n=function(e,t){if(null==e)return{};var a,r,n={},i=Object.keys(e);for(r=0;r<i.length;r++)a=i[r],t.indexOf(a)>=0||(n[a]=e[a]);return n}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)a=i[r],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(n[a]=e[a])}return n}var d=r.createContext({}),s=function(e){var t=r.useContext(d),a=t;return e&&(a="function"==typeof e?e(t):p(p({},t),e)),a},o=function(e){var t=s(e.components);return r.createElement(d.Provider,{value:t},e.children)},m={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},k=r.forwardRef((function(e,t){var a=e.components,n=e.mdxType,i=e.originalType,d=e.parentName,o=l(e,["components","mdxType","originalType","parentName"]),k=s(a),N=n,h=k["".concat(d,".").concat(N)]||k[N]||m[N]||i;return a?r.createElement(h,p(p({ref:t},o),{},{components:a})):r.createElement(h,p({ref:t},o))}));function N(e,t){var a=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var i=a.length,p=new Array(i);p[0]=k;var l={};for(var d in t)hasOwnProperty.call(t,d)&&(l[d]=t[d]);l.originalType=e,l.mdxType="string"==typeof e?e:n,p[1]=l;for(var s=2;s<i;s++)p[s]=a[s];return r.createElement.apply(null,p)}return r.createElement.apply(null,a)}k.displayName="MDXCreateElement"},7782:function(e,t,a){a.r(t),a.d(t,{frontMatter:function(){return p},contentTitle:function(){return l},metadata:function(){return d},toc:function(){return s},default:function(){return m}});var r=a(2122),n=a(9756),i=(a(7294),a(3905)),p={id:"api.GraphDataProvider",title:"Class: GraphDataProvider",sidebar_label:"GraphDataProvider",custom_edit_url:null},l=void 0,d={unversionedId:"classes/api.GraphDataProvider",id:"classes/api.GraphDataProvider",isDocsHomePage:!1,title:"Class: GraphDataProvider",description:"api.GraphDataProvider",source:"@site/api/classes/api.GraphDataProvider.md",sourceDirName:"classes",slug:"/classes/api.GraphDataProvider",permalink:"/mapillary-js/api/classes/api.GraphDataProvider",editUrl:null,version:"current",frontMatter:{id:"api.GraphDataProvider",title:"Class: GraphDataProvider",sidebar_label:"GraphDataProvider",custom_edit_url:null},sidebar:"api",previous:{title:"GeometryProviderBase",permalink:"/mapillary-js/api/classes/api.GeometryProviderBase"},next:{title:"S2GeometryProvider",permalink:"/mapillary-js/api/classes/api.S2GeometryProvider"}},s=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Constructors",id:"constructors",children:[{value:"constructor",id:"constructor",children:[]}]},{value:"Events",id:"events",children:[{value:"on",id:"on",children:[]}]},{value:"Accessors",id:"accessors",children:[{value:"geometry",id:"geometry",children:[]}]},{value:"Methods",id:"methods",children:[{value:"fire",id:"fire",children:[]},{value:"getCluster",id:"getcluster",children:[]},{value:"getCoreImages",id:"getcoreimages",children:[]},{value:"getImageBuffer",id:"getimagebuffer",children:[]},{value:"getImageTiles",id:"getimagetiles",children:[]},{value:"getImages",id:"getimages",children:[]},{value:"getMesh",id:"getmesh",children:[]},{value:"getSequence",id:"getsequence",children:[]},{value:"getSpatialImages",id:"getspatialimages",children:[]},{value:"off",id:"off",children:[]},{value:"setAccessToken",id:"setaccesstoken",children:[]}]}],o={toc:s};function m(e){var t=e.components,a=(0,n.Z)(e,["components"]);return(0,i.kt)("wrapper",(0,r.Z)({},o,a,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/api"},"api"),".GraphDataProvider"),(0,i.kt)("h2",{id:"hierarchy"},"Hierarchy"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("p",{parentName:"li"},(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase"},(0,i.kt)("inlineCode",{parentName:"a"},"DataProviderBase"))),(0,i.kt)("p",{parentName:"li"},"\u21b3 ",(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"GraphDataProvider"))))),(0,i.kt)("h2",{id:"constructors"},"Constructors"),(0,i.kt)("h3",{id:"constructor"},"constructor"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"new GraphDataProvider"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"options?"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"geometry?"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"converter?"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"queryCreator?"),")"),(0,i.kt)("p",null,"Create a new data provider base instance."),(0,i.kt)("h4",{id:"parameters"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"options?")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("a",{parentName:"td",href:"/mapillary-js/api/interfaces/api.GraphDataProviderOptions"},(0,i.kt)("inlineCode",{parentName:"a"},"GraphDataProviderOptions")))),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"geometry?")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("a",{parentName:"td",href:"/mapillary-js/api/classes/api.GeometryProviderBase"},(0,i.kt)("inlineCode",{parentName:"a"},"GeometryProviderBase")))),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"converter?")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"GraphConverter"))),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"queryCreator?")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"GraphQueryCreator"))))),(0,i.kt)("h4",{id:"overrides"},"Overrides"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase"},"DataProviderBase"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase#constructor"},"constructor")),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/provider/GraphDataProvider.ts#L49"},"api/provider/GraphDataProvider.ts:49")),(0,i.kt)("h2",{id:"events"},"Events"),(0,i.kt)("h3",{id:"on"},"on"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"on"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"type"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"handler"),"): ",(0,i.kt)("inlineCode",{parentName:"p"},"void")),(0,i.kt)("p",null,"Fired when data has been created in the data provider\nafter initial load."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"example"))),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},'// Initialize the data provider\nclass MyDataProvider extends DataProviderBase {\n  // implementation\n}\nvar provider = new MyDataProvider();\n// Set an event listener\nprovider.on("datacreate", function() {\n  console.log("A datacreate event has occurred.");\n});\n')),(0,i.kt)("h4",{id:"parameters-1"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"type")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},'"datacreate"'))),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"handler")),(0,i.kt)("td",{parentName:"tr",align:"left"},"(",(0,i.kt)("inlineCode",{parentName:"td"},"event"),": ",(0,i.kt)("a",{parentName:"td",href:"/mapillary-js/api/interfaces/api.ProviderCellEvent"},(0,i.kt)("inlineCode",{parentName:"a"},"ProviderCellEvent")),") => ",(0,i.kt)("inlineCode",{parentName:"td"},"void"))))),(0,i.kt)("h4",{id:"returns"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"void")),(0,i.kt)("h4",{id:"inherited-from"},"Inherited from"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase"},"DataProviderBase"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase#on"},"on")),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/DataProviderBase.ts#L261"},"api/DataProviderBase.ts:261")),(0,i.kt)("h2",{id:"accessors"},"Accessors"),(0,i.kt)("h3",{id:"geometry"},"geometry"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," ",(0,i.kt)("strong",{parentName:"p"},"geometry"),"(): ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.GeometryProviderBase"},(0,i.kt)("inlineCode",{parentName:"a"},"GeometryProviderBase"))),(0,i.kt)("p",null,"Get geometry property."),(0,i.kt)("h4",{id:"returns-1"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.GeometryProviderBase"},(0,i.kt)("inlineCode",{parentName:"a"},"GeometryProviderBase"))),(0,i.kt)("p",null,"Geometry provider instance."),(0,i.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/DataProviderBase.ts#L56"},"api/DataProviderBase.ts:56")),(0,i.kt)("h2",{id:"methods"},"Methods"),(0,i.kt)("h3",{id:"fire"},"fire"),(0,i.kt)("p",null,"\u25b8 ",(0,i.kt)("strong",{parentName:"p"},"fire"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"type"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"event"),"): ",(0,i.kt)("inlineCode",{parentName:"p"},"void")),(0,i.kt)("p",null,"Fire when data has been created in the data provider\nafter initial load."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"example"))),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},'// Initialize the data provider\nclass MyDataProvider extends DataProviderBase {\n  // Class implementation\n}\nvar provider = new MyDataProvider();\n// Create the event\nvar cellIds = [ // Determine updated cells ];\nvar target = provider;\nvar type = "datacreate";\nvar event = {\n  cellIds,\n  target,\n  type,\n};\n// Fire the event\nprovider.fire(type, event);\n')),(0,i.kt)("h4",{id:"parameters-2"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Description"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"type")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},'"datacreate"')),(0,i.kt)("td",{parentName:"tr",align:"left"},"datacreate")),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"event")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("a",{parentName:"td",href:"/mapillary-js/api/interfaces/api.ProviderCellEvent"},(0,i.kt)("inlineCode",{parentName:"a"},"ProviderCellEvent"))),(0,i.kt)("td",{parentName:"tr",align:"left"},"Provider cell event")))),(0,i.kt)("h4",{id:"returns-2"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"void")),(0,i.kt)("h4",{id:"inherited-from-1"},"Inherited from"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase"},"DataProviderBase"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase#fire"},"fire")),(0,i.kt)("h4",{id:"defined-in-3"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/DataProviderBase.ts#L87"},"../doc/api/DataProviderBase.ts:87")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"getcluster"},"getCluster"),(0,i.kt)("p",null,"\u25b8 ",(0,i.kt)("strong",{parentName:"p"},"getCluster"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"url"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"abort?"),"): ",(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.ClusterContract"},(0,i.kt)("inlineCode",{parentName:"a"},"ClusterContract")),">"),(0,i.kt)("p",null,"Get a cluster reconstruction."),(0,i.kt)("h4",{id:"parameters-3"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"url")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"string"))),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"abort?")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"Promise"),"<",(0,i.kt)("inlineCode",{parentName:"td"},"void"),">")))),(0,i.kt)("h4",{id:"returns-3"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.ClusterContract"},(0,i.kt)("inlineCode",{parentName:"a"},"ClusterContract")),">"),(0,i.kt)("p",null,"Promise to the\ncluster reconstruction."),(0,i.kt)("h4",{id:"overrides-1"},"Overrides"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase"},"DataProviderBase"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase#getcluster"},"getCluster")),(0,i.kt)("h4",{id:"defined-in-4"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/provider/GraphDataProvider.ts#L66"},"api/provider/GraphDataProvider.ts:66")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"getcoreimages"},"getCoreImages"),(0,i.kt)("p",null,"\u25b8 ",(0,i.kt)("strong",{parentName:"p"},"getCoreImages"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"cellId"),"): ",(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.CoreImagesContract"},(0,i.kt)("inlineCode",{parentName:"a"},"CoreImagesContract")),">"),(0,i.kt)("p",null,"Get core images in a geometry cell."),(0,i.kt)("h4",{id:"parameters-4"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"cellId")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"string"))))),(0,i.kt)("h4",{id:"returns-4"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.CoreImagesContract"},(0,i.kt)("inlineCode",{parentName:"a"},"CoreImagesContract")),">"),(0,i.kt)("p",null,"Promise to\nthe core images of the requested geometry cell id."),(0,i.kt)("h4",{id:"overrides-2"},"Overrides"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase"},"DataProviderBase"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase#getcoreimages"},"getCoreImages")),(0,i.kt)("h4",{id:"defined-in-5"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/provider/GraphDataProvider.ts#L85"},"api/provider/GraphDataProvider.ts:85")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"getimagebuffer"},"getImageBuffer"),(0,i.kt)("p",null,"\u25b8 ",(0,i.kt)("strong",{parentName:"p"},"getImageBuffer"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"url"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"abort?"),"): ",(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("inlineCode",{parentName:"p"},"ArrayBuffer"),">"),(0,i.kt)("p",null,"Get an image as an array buffer."),(0,i.kt)("h4",{id:"parameters-5"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"url")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"string"))),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"abort?")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"Promise"),"<",(0,i.kt)("inlineCode",{parentName:"td"},"void"),">")))),(0,i.kt)("h4",{id:"returns-5"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("inlineCode",{parentName:"p"},"ArrayBuffer"),">"),(0,i.kt)("p",null,"Promise to the array\nbuffer containing the image."),(0,i.kt)("h4",{id:"overrides-3"},"Overrides"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase"},"DataProviderBase"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase#getimagebuffer"},"getImageBuffer")),(0,i.kt)("h4",{id:"defined-in-6"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/provider/GraphDataProvider.ts#L114"},"api/provider/GraphDataProvider.ts:114")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"getimagetiles"},"getImageTiles"),(0,i.kt)("p",null,"\u25b8 ",(0,i.kt)("strong",{parentName:"p"},"getImageTiles"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"request"),"): ",(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/api#imagetilescontract"},(0,i.kt)("inlineCode",{parentName:"a"},"ImageTilesContract")),">"),(0,i.kt)("p",null,"Get image tiles urls for a tile level."),(0,i.kt)("h4",{id:"parameters-6"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"request")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("a",{parentName:"td",href:"/mapillary-js/api/interfaces/api.ImageTilesRequestContract"},(0,i.kt)("inlineCode",{parentName:"a"},"ImageTilesRequestContract")))))),(0,i.kt)("h4",{id:"returns-6"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/api#imagetilescontract"},(0,i.kt)("inlineCode",{parentName:"a"},"ImageTilesContract")),">"),(0,i.kt)("p",null,"Promise to the\nimage tiles response contract"),(0,i.kt)("h4",{id:"overrides-4"},"Overrides"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase"},"DataProviderBase"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase#getimagetiles"},"getImageTiles")),(0,i.kt)("h4",{id:"defined-in-7"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/provider/GraphDataProvider.ts#L154"},"api/provider/GraphDataProvider.ts:154")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"getimages"},"getImages"),(0,i.kt)("p",null,"\u25b8 ",(0,i.kt)("strong",{parentName:"p"},"getImages"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"imageIds"),"): ",(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/api#imagescontract"},(0,i.kt)("inlineCode",{parentName:"a"},"ImagesContract")),">"),(0,i.kt)("p",null,"Get complete images."),(0,i.kt)("h4",{id:"parameters-7"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"imageIds")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"string"),"[]")))),(0,i.kt)("h4",{id:"returns-7"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/api#imagescontract"},(0,i.kt)("inlineCode",{parentName:"a"},"ImagesContract")),">"),(0,i.kt)("p",null,"Promise to the images of the\nrequested image ids."),(0,i.kt)("h4",{id:"overrides-5"},"Overrides"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase"},"DataProviderBase"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase#getimages"},"getImages")),(0,i.kt)("h4",{id:"defined-in-8"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/provider/GraphDataProvider.ts#L121"},"api/provider/GraphDataProvider.ts:121")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"getmesh"},"getMesh"),(0,i.kt)("p",null,"\u25b8 ",(0,i.kt)("strong",{parentName:"p"},"getMesh"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"url"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"abort?"),"): ",(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.MeshContract"},(0,i.kt)("inlineCode",{parentName:"a"},"MeshContract")),">"),(0,i.kt)("p",null,"Get a mesh."),(0,i.kt)("h4",{id:"parameters-8"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"url")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"string"))),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"abort?")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"Promise"),"<",(0,i.kt)("inlineCode",{parentName:"td"},"void"),">")))),(0,i.kt)("h4",{id:"returns-8"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.MeshContract"},(0,i.kt)("inlineCode",{parentName:"a"},"MeshContract")),">"),(0,i.kt)("p",null,"Promise to the mesh."),(0,i.kt)("h4",{id:"overrides-6"},"Overrides"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase"},"DataProviderBase"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase#getmesh"},"getMesh")),(0,i.kt)("h4",{id:"defined-in-9"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/provider/GraphDataProvider.ts#L179"},"api/provider/GraphDataProvider.ts:179")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"getsequence"},"getSequence"),(0,i.kt)("p",null,"\u25b8 ",(0,i.kt)("strong",{parentName:"p"},"getSequence"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"sequenceId"),"): ",(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.SequenceEnt"},(0,i.kt)("inlineCode",{parentName:"a"},"SequenceEnt")),">"),(0,i.kt)("p",null,"Get sequence."),(0,i.kt)("h4",{id:"parameters-9"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"sequenceId")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"string"))))),(0,i.kt)("h4",{id:"returns-9"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.SequenceEnt"},(0,i.kt)("inlineCode",{parentName:"a"},"SequenceEnt")),">"),(0,i.kt)("p",null,"Promise to the sequences of the\nrequested image ids."),(0,i.kt)("h4",{id:"overrides-7"},"Overrides"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase"},"DataProviderBase"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase#getsequence"},"getSequence")),(0,i.kt)("h4",{id:"defined-in-10"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/provider/GraphDataProvider.ts#L190"},"api/provider/GraphDataProvider.ts:190")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"getspatialimages"},"getSpatialImages"),(0,i.kt)("p",null,"\u25b8 ",(0,i.kt)("strong",{parentName:"p"},"getSpatialImages"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"imageIds"),"): ",(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/api#spatialimagescontract"},(0,i.kt)("inlineCode",{parentName:"a"},"SpatialImagesContract")),">"),(0,i.kt)("p",null,"Get spatial images."),(0,i.kt)("h4",{id:"parameters-10"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"imageIds")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"string"),"[]")))),(0,i.kt)("h4",{id:"returns-10"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"Promise"),"<",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/api#spatialimagescontract"},(0,i.kt)("inlineCode",{parentName:"a"},"SpatialImagesContract")),">"),(0,i.kt)("p",null,"Promise to\nthe spatial images of the requested image ids."),(0,i.kt)("h4",{id:"overrides-8"},"Overrides"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase"},"DataProviderBase"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase#getspatialimages"},"getSpatialImages")),(0,i.kt)("h4",{id:"defined-in-11"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/provider/GraphDataProvider.ts#L211"},"api/provider/GraphDataProvider.ts:211")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"off"},"off"),(0,i.kt)("p",null,"\u25b8 ",(0,i.kt)("strong",{parentName:"p"},"off"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"type"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"handler"),"): ",(0,i.kt)("inlineCode",{parentName:"p"},"void")),(0,i.kt)("h4",{id:"parameters-11"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"type")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},'"datacreate"'))),(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"handler")),(0,i.kt)("td",{parentName:"tr",align:"left"},"(",(0,i.kt)("inlineCode",{parentName:"td"},"event"),": ",(0,i.kt)("a",{parentName:"td",href:"/mapillary-js/api/interfaces/api.ProviderCellEvent"},(0,i.kt)("inlineCode",{parentName:"a"},"ProviderCellEvent")),") => ",(0,i.kt)("inlineCode",{parentName:"td"},"void"))))),(0,i.kt)("h4",{id:"returns-11"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"void")),(0,i.kt)("h4",{id:"inherited-from-2"},"Inherited from"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase"},"DataProviderBase"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase#off"},"off")),(0,i.kt)("h4",{id:"defined-in-12"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/DataProviderBase.ts#L227"},"../doc/api/DataProviderBase.ts:227")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"setaccesstoken"},"setAccessToken"),(0,i.kt)("p",null,"\u25b8 ",(0,i.kt)("strong",{parentName:"p"},"setAccessToken"),"(",(0,i.kt)("inlineCode",{parentName:"p"},"accessToken"),"): ",(0,i.kt)("inlineCode",{parentName:"p"},"void")),(0,i.kt)("p",null,"Set an access token for authenticated API requests of\nprotected resources."),(0,i.kt)("h4",{id:"parameters-12"},"Parameters"),(0,i.kt)("table",null,(0,i.kt)("thead",{parentName:"table"},(0,i.kt)("tr",{parentName:"thead"},(0,i.kt)("th",{parentName:"tr",align:"left"},"Name"),(0,i.kt)("th",{parentName:"tr",align:"left"},"Type"))),(0,i.kt)("tbody",{parentName:"table"},(0,i.kt)("tr",{parentName:"tbody"},(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"accessToken")),(0,i.kt)("td",{parentName:"tr",align:"left"},(0,i.kt)("inlineCode",{parentName:"td"},"string"))))),(0,i.kt)("h4",{id:"returns-12"},"Returns"),(0,i.kt)("p",null,(0,i.kt)("inlineCode",{parentName:"p"},"void")),(0,i.kt)("h4",{id:"overrides-9"},"Overrides"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase"},"DataProviderBase"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/classes/api.DataProviderBase#setaccesstoken"},"setAccessToken")),(0,i.kt)("h4",{id:"defined-in-13"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/provider/GraphDataProvider.ts#L242"},"api/provider/GraphDataProvider.ts:242")))}m.isMDXComponent=!0}}]);