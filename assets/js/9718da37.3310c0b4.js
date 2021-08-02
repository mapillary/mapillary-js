"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[9522],{3905:function(e,t,n){n.d(t,{Zo:function(){return c},kt:function(){return d}});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function p(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var o=r.createContext({}),m=function(e){var t=r.useContext(o),n=t;return e&&(n="function"==typeof e?e(t):p(p({},t),e)),n},c=function(e){var t=m(e.components);return r.createElement(o.Provider,{value:t},e.children)},s={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},u=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,i=e.originalType,o=e.parentName,c=l(e,["components","mdxType","originalType","parentName"]),u=m(n),d=a,f=u["".concat(o,".").concat(d)]||u[d]||s[d]||i;return n?r.createElement(f,p(p({ref:t},c),{},{components:n})):r.createElement(f,p({ref:t},c))}));function d(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=n.length,p=new Array(i);p[0]=u;var l={};for(var o in t)hasOwnProperty.call(t,o)&&(l[o]=t[o]);l.originalType=e,l.mdxType="string"==typeof e?e:a,p[1]=l;for(var m=2;m<i;m++)p[m]=n[m];return r.createElement.apply(null,p)}return r.createElement.apply(null,n)}u.displayName="MDXCreateElement"},7912:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return p},contentTitle:function(){return l},metadata:function(){return o},toc:function(){return m},default:function(){return s}});var r=n(2122),a=n(9756),i=(n(7294),n(3905)),p={id:"api.CoreImageEnt",title:"Interface: CoreImageEnt",sidebar_label:"CoreImageEnt",custom_edit_url:null},l=void 0,o={unversionedId:"interfaces/api.CoreImageEnt",id:"interfaces/api.CoreImageEnt",isDocsHomePage:!1,title:"Interface: CoreImageEnt",description:"api.CoreImageEnt",source:"@site/api/interfaces/api.CoreImageEnt.md",sourceDirName:"interfaces",slug:"/interfaces/api.CoreImageEnt",permalink:"/mapillary-js/api/interfaces/api.CoreImageEnt",editUrl:null,version:"current",frontMatter:{id:"api.CoreImageEnt",title:"Interface: CoreImageEnt",sidebar_label:"CoreImageEnt",custom_edit_url:null},sidebar:"api",previous:{title:"ClusterContract",permalink:"/mapillary-js/api/interfaces/api.ClusterContract"},next:{title:"CoreImagesContract",permalink:"/mapillary-js/api/interfaces/api.CoreImagesContract"}},m=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Properties",id:"properties",children:[{value:"computed_geometry",id:"computed_geometry",children:[]},{value:"geometry",id:"geometry",children:[]},{value:"id",id:"id",children:[]},{value:"sequence",id:"sequence",children:[]}]}],c={toc:m};function s(e){var t=e.components,n=(0,a.Z)(e,["components"]);return(0,i.kt)("wrapper",(0,r.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/api"},"api"),".CoreImageEnt"),(0,i.kt)("p",null,"Ent representing core image properties."),(0,i.kt)("h2",{id:"hierarchy"},"Hierarchy"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("p",{parentName:"li"},(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.IDEnt"},(0,i.kt)("inlineCode",{parentName:"a"},"IDEnt"))),(0,i.kt)("p",{parentName:"li"},"\u21b3 ",(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"CoreImageEnt"))),(0,i.kt)("p",{parentName:"li"},"\u21b3\u21b3 ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.ImageEnt"},(0,i.kt)("inlineCode",{parentName:"a"},"ImageEnt"))))),(0,i.kt)("h2",{id:"properties"},"Properties"),(0,i.kt)("h3",{id:"computed_geometry"},"computed","_","geometry"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("inlineCode",{parentName:"p"},"Optional")," ",(0,i.kt)("strong",{parentName:"p"},"computed","_","geometry"),": ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.LngLat"},(0,i.kt)("inlineCode",{parentName:"a"},"LngLat"))),(0,i.kt)("p",null,"SfM computed longitude, latitude in WGS84 datum, measured in degrees."),(0,i.kt)("p",null,(0,i.kt)("strong",{parentName:"p"},(0,i.kt)("inlineCode",{parentName:"strong"},"description"))," Optional - no 3D interaction available\nif unset."),(0,i.kt)("h4",{id:"defined-in"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/ents/CoreImageEnt.ts#L14"},"api/ents/CoreImageEnt.ts:14")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"geometry"},"geometry"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"geometry"),": ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.LngLat"},(0,i.kt)("inlineCode",{parentName:"a"},"LngLat"))),(0,i.kt)("p",null,"Original EXIF longitude, latitude in WGS84 datum, measured in degrees."),(0,i.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/ents/CoreImageEnt.ts#L19"},"api/ents/CoreImageEnt.ts:19")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"id"},"id"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"id"),": ",(0,i.kt)("inlineCode",{parentName:"p"},"string")),(0,i.kt)("p",null,"Unique ID."),(0,i.kt)("h4",{id:"inherited-from"},"Inherited from"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.IDEnt"},"IDEnt"),".",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.IDEnt#id"},"id")),(0,i.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/ents/IDEnt.ts#L10"},"api/ents/IDEnt.ts:10")),(0,i.kt)("hr",null),(0,i.kt)("h3",{id:"sequence"},"sequence"),(0,i.kt)("p",null,"\u2022 ",(0,i.kt)("strong",{parentName:"p"},"sequence"),": ",(0,i.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/api.IDEnt"},(0,i.kt)("inlineCode",{parentName:"a"},"IDEnt"))),(0,i.kt)("p",null,"Sequence that the image is part of."),(0,i.kt)("h4",{id:"defined-in-3"},"Defined in"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/86586f0c/src/api/ents/CoreImageEnt.ts#L24"},"api/ents/CoreImageEnt.ts:24")))}s.isMDXComponent=!0}}]);