"use strict";(self.webpackChunkmapillary_js_doc=self.webpackChunkmapillary_js_doc||[]).push([[4105],{3905:function(e,n,t){t.d(n,{Zo:function(){return d},kt:function(){return u}});var a=t(7294);function r(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function l(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);n&&(a=a.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,a)}return t}function i(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?l(Object(t),!0).forEach((function(n){r(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):l(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function o(e,n){if(null==e)return{};var t,a,r=function(e,n){if(null==e)return{};var t,a,r={},l=Object.keys(e);for(a=0;a<l.length;a++)t=l[a],n.indexOf(t)>=0||(r[t]=e[t]);return r}(e,n);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(a=0;a<l.length;a++)t=l[a],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(r[t]=e[t])}return r}var p=a.createContext({}),s=function(e){var n=a.useContext(p),t=n;return e&&(t="function"==typeof e?e(n):i(i({},n),e)),t},d=function(e){var n=s(e.components);return a.createElement(p.Provider,{value:n},e.children)},c={inlineCode:"code",wrapper:function(e){var n=e.children;return a.createElement(a.Fragment,{},n)}},m=a.forwardRef((function(e,n){var t=e.components,r=e.mdxType,l=e.originalType,p=e.parentName,d=o(e,["components","mdxType","originalType","parentName"]),m=s(t),u=r,k=m["".concat(p,".").concat(u)]||m[u]||c[u]||l;return t?a.createElement(k,i(i({ref:n},d),{},{components:t})):a.createElement(k,i({ref:n},d))}));function u(e,n){var t=arguments,r=n&&n.mdxType;if("string"==typeof e||r){var l=t.length,i=new Array(l);i[0]=m;var o={};for(var p in n)hasOwnProperty.call(n,p)&&(o[p]=n[p]);o.originalType=e,o.mdxType="string"==typeof e?e:r,i[1]=o;for(var s=2;s<l;s++)i[s]=t[s];return a.createElement.apply(null,i)}return a.createElement.apply(null,t)}m.displayName="MDXCreateElement"},3225:function(e,n,t){t.r(n),t.d(n,{frontMatter:function(){return i},contentTitle:function(){return o},metadata:function(){return p},toc:function(){return s},default:function(){return c}});var a=t(2122),r=t(9756),l=(t(7294),t(3905)),i={id:"component.DragPanHandler",title:"Class: DragPanHandler",sidebar_label:"DragPanHandler",custom_edit_url:null},o=void 0,p={unversionedId:"classes/component.DragPanHandler",id:"classes/component.DragPanHandler",isDocsHomePage:!1,title:"Class: DragPanHandler",description:"component.DragPanHandler",source:"@site/api/classes/component.DragPanHandler.md",sourceDirName:"classes",slug:"/classes/component.DragPanHandler",permalink:"/mapillary-js/api/classes/component.DragPanHandler",editUrl:null,tags:[],version:"current",frontMatter:{id:"component.DragPanHandler",title:"Class: DragPanHandler",sidebar_label:"DragPanHandler",custom_edit_url:null},sidebar:"api",previous:{title:"DirectionComponent",permalink:"/mapillary-js/api/classes/component.DirectionComponent"},next:{title:"ExtremePointTag",permalink:"/mapillary-js/api/classes/component.ExtremePointTag"}},s=[{value:"Hierarchy",id:"hierarchy",children:[]},{value:"Accessors",id:"accessors",children:[{value:"isEnabled",id:"isenabled",children:[]}]},{value:"Methods",id:"methods",children:[{value:"disable",id:"disable",children:[]},{value:"enable",id:"enable",children:[]}]}],d={toc:s};function c(e){var n=e.components,t=(0,r.Z)(e,["components"]);return(0,l.kt)("wrapper",(0,a.Z)({},d,t,{components:n,mdxType:"MDXLayout"}),(0,l.kt)("p",null,(0,l.kt)("a",{parentName:"p",href:"/mapillary-js/api/modules/component"},"component"),".DragPanHandler"),(0,l.kt)("p",null,"The ",(0,l.kt)("inlineCode",{parentName:"p"},"DragPanHandler")," allows the user to pan the viewer image by clicking and dragging the cursor."),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},(0,l.kt)("inlineCode",{parentName:"strong"},"example"))),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-js"},'var pointerComponent = viewer.getComponent("pointer");\n\npointerComponent.dragPan.disable();\npointerComponent.dragPan.enable();\n\nvar isEnabled = pointerComponent.dragPan.isEnabled;\n')),(0,l.kt)("h2",{id:"hierarchy"},"Hierarchy"),(0,l.kt)("ul",null,(0,l.kt)("li",{parentName:"ul"},(0,l.kt)("p",{parentName:"li"},(0,l.kt)("inlineCode",{parentName:"p"},"HandlerBase"),"<",(0,l.kt)("a",{parentName:"p",href:"/mapillary-js/api/interfaces/component.PointerConfiguration"},(0,l.kt)("inlineCode",{parentName:"a"},"PointerConfiguration")),">"),(0,l.kt)("p",{parentName:"li"},"\u21b3 ",(0,l.kt)("strong",{parentName:"p"},(0,l.kt)("inlineCode",{parentName:"strong"},"DragPanHandler"))))),(0,l.kt)("h2",{id:"accessors"},"Accessors"),(0,l.kt)("h3",{id:"isenabled"},"isEnabled"),(0,l.kt)("p",null,"\u2022 ",(0,l.kt)("inlineCode",{parentName:"p"},"get")," ",(0,l.kt)("strong",{parentName:"p"},"isEnabled"),"(): ",(0,l.kt)("inlineCode",{parentName:"p"},"boolean")),(0,l.kt)("p",null,"Returns a Boolean indicating whether the interaction is enabled."),(0,l.kt)("h4",{id:"returns"},"Returns"),(0,l.kt)("p",null,(0,l.kt)("inlineCode",{parentName:"p"},"boolean")),(0,l.kt)("p",null,(0,l.kt)("inlineCode",{parentName:"p"},"true")," if the interaction is enabled."),(0,l.kt)("h4",{id:"defined-in"},"Defined in"),(0,l.kt)("p",null,(0,l.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/component/util/HandlerBase.ts#L31"},"component/util/HandlerBase.ts:31")),(0,l.kt)("h2",{id:"methods"},"Methods"),(0,l.kt)("h3",{id:"disable"},"disable"),(0,l.kt)("p",null,"\u25b8 ",(0,l.kt)("strong",{parentName:"p"},"disable"),"(): ",(0,l.kt)("inlineCode",{parentName:"p"},"void")),(0,l.kt)("p",null,"Disables the interaction."),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},(0,l.kt)("inlineCode",{parentName:"strong"},"example"))),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-js"},"<component-name>.<handler-name>.disable();\n")),(0,l.kt)("h4",{id:"returns-1"},"Returns"),(0,l.kt)("p",null,(0,l.kt)("inlineCode",{parentName:"p"},"void")),(0,l.kt)("h4",{id:"inherited-from"},"Inherited from"),(0,l.kt)("p",null,"HandlerBase.disable"),(0,l.kt)("h4",{id:"defined-in-1"},"Defined in"),(0,l.kt)("p",null,(0,l.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/component/util/HandlerBase.ts#L60"},"component/util/HandlerBase.ts:60")),(0,l.kt)("hr",null),(0,l.kt)("h3",{id:"enable"},"enable"),(0,l.kt)("p",null,"\u25b8 ",(0,l.kt)("strong",{parentName:"p"},"enable"),"(): ",(0,l.kt)("inlineCode",{parentName:"p"},"void")),(0,l.kt)("p",null,"Enables the interaction."),(0,l.kt)("p",null,(0,l.kt)("strong",{parentName:"p"},(0,l.kt)("inlineCode",{parentName:"strong"},"example"))),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-js"},"<component-name>.<handler-name>.enable();\n")),(0,l.kt)("h4",{id:"returns-2"},"Returns"),(0,l.kt)("p",null,(0,l.kt)("inlineCode",{parentName:"p"},"void")),(0,l.kt)("h4",{id:"inherited-from-1"},"Inherited from"),(0,l.kt)("p",null,"HandlerBase.enable"),(0,l.kt)("h4",{id:"defined-in-2"},"Defined in"),(0,l.kt)("p",null,(0,l.kt)("a",{parentName:"p",href:"https://github.com/mapillary/mapillary-js/blob/486d5b23/src/component/util/HandlerBase.ts#L43"},"component/util/HandlerBase.ts:43")))}c.isMDXComponent=!0}}]);