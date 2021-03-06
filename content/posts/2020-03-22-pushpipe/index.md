---
title: "Reactive Angular with ngrx/component"
author: Chris Kohler
date: "2020-03-22"
hero: "./images/hero.jpg"
cover_image: "./images/hero.jpg"
published: true
secret: false
canonical_url: "https://christiankohler.net/reactive-angular-with-ngrx-component"
masterid: 20200322
excerpt: One step closer to a zone-less Angular
description: One step closer a to zone-less Angular
tags: angular, rxjs, ngrx
---

## tl;dr

Angular change detection relies on Zone.js which works well in most situations but is hard to debug and might lead to performance problems.

With the rise of reactive programming in Angular we might not need Zone.js at all and instead trigger change detection whenever the view state changes.

[Michael Hladky](https://twitter.com/Michael_Hladky) and the ngrx team are working on a library named ngrx/component to make it easier to trigger change detection with observables.

In this article we look at how this new library helps us write maintainable code without Zone.js

## TOC

1. 🤔 What's wrong with Zone.js?
2. 🔦 When should we run change detection?
3. 🚲 Zone less approach in Angular
4. 💡 Change detection in a reactive application
5. 🚧 Async Pipe
6. 🚀 ngrx PushPipe and let directive
7. ❓ Should I now rewrite my code?
8. 👩‍🚀 Be ready for a reactive (zone-less) future
9. 📚 Resources

## What's wrong with Zone.js? 🤔

Most Angular developers learn about Zone.js when they run into change detection issues. Zone.js doesn't do change detection but triggers it after async operations were completed. One good example is a `setTimeout()` callback after which Zone.js triggers change detection.

> In general Zone.js just works and helps Angular developers write less code.

But every design decision has its pros and cons.

### The problems withs Zone.js are

- it's hard to debug
- it might lead to performance issues
- no native async await support (Typescript target: ES2017 or higher)

### Zones.js allows for a mix of imperative and reactive code

I often see how part of an Angular application is written in a imperative way and part of it reactive. It's not always a bad thing but I feel that the mix often makes it harder to read code.

In 2019 Rob Wormald talked about Zone.js in his keynote. He said:

> Zones are great until they are not.

Watch the full keynote here: [Rob Wormald - Keynote - What's New and Coming in Angular | AngularUP 2019](https://www.youtube.com/watch?v=-32nh-pGXaU&feature=youtu.be&t=19m10s)

## When should we run change detection? 🔦

With Zone.js Angular change detection magically works for almost any scenario. To make it work, it assumes that whenever you have an event like a click event, the state changed and the view has to be rerendered.

Let's take that simple example:

```typescript
@Component({
  template: `
    <div>Count is {{ count }}</div>
    <button (click)="increment()">Increment</button>
    <button (click)="noEffect()">Dummy Button</button>
  `
})
export class AppComponent {
  count = 0;

  // triggers change detection
  increment() {
    this.count = this.count + 1;
  }

  // also triggers change detection
  noEffect() {}
}
```

In this example Angular needs to trigger change detection after the `increment` method because we want to update our view. But we don't need to trigger change detection after we call the `noEffect` method

> Ideally we only trigger change detection when the view state changes

### The React way

In React you change the state explicitly which then triggers a rerender. In the following example the setCount sets part of the state.

```jsx
function Example() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}
```

This approach is easy to understand and to debug.

## Zone less approach in Angular 🚲

So let's get rid of Zone.js and let's try to make change detection more predictable and easier to debug.

We can easily disable Zone.js in Angular by setting ngZone to "noop":

```typescript
platformBrowserDynamic().bootstrapModule(AppModule, {
  ngZone: "noop"
});
```

Since change detection is not triggered anymore by Zone.js we need to trigger it manually:

```typescript
export class AppComponent {
  count = 0;

  constructor(private cdRef: ChangeDetectorRef) {}

  increment() {
    this.count = this.count + 1;
    this.cdRef.detectChanges();
  }

  noEffect() {}
}
```

This approach works but involves a lot of manual work and pollutes our code with change detection logic. Also due to the imperative nature of that code it can become very difficult to understand what triggered change detection the more complex the code gets.

## Change detection in a reactive application 💡

In a reactive application we know exactly when a change happens. Every time a new value is emitted in a observable. And whenever a change happens we can trigger change detection. This means we don't need to rely on Zone.js to trigger change detection.

> When every view state is an observable, we know exactly when to trigger change detection.

Notice how this is a very similar to Reacts approach?

## Async Pipe 🚧

With Zone.js deactivated the first idea for a reactive approach would be to use Angulars async pipe to trigger change detection when a new value is emitted.

```typescript
@Component({
  template: `
    <div>Count is {{ count$ | async }}</div>
    <button (click)="increment()">Increment</button>
    <button (click)="noEffect()">Dummy Button</button>
  `
})
export class AppComponent {
  increment$ = new Subject();

  count$ = this.increment$.pipe(
    scan(count => count + 1, 0),
    startWith(0)
  );

  increment() {
    this.increment$.next();
  }
}
```

Unfortunately that **doesn't trigger change detection** since the async pipe only runs markForChecked on the components ChangeDetectorRef.

So we need an async pipe which can trigger change detection. Luckily there is a library [coming up](https://github.com/ngrx/platform/pull/2046) for exactly that.

## ngrx PushPipe and let directive 🚀

[Michael Hladky](https://twitter.com/Michael_Hladky) and the ngrx team are working on a new library named ngrx/component. It's not released yet but we can already try it out. It's a collection of tools to make it easier to write reactive angular components.

Or as [Michael Hladky](https://twitter.com/Michael_Hladky) says:

> "The idea of ngrx/component is building applications where the word subscribe is not present."

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">In <a href="https://twitter.com/hashtag/rxjs?src=hash&amp;ref_src=twsrc%5Etfw">#rxjs</a> .subscribe() is where reactive programming ends</p>&mdash; Michael Rx Hladky (@Michael_Hladky) <a href="https://twitter.com/Michael_Hladky/status/1180316203937681410?ref_src=twsrc%5Etfw">October 5, 2019</a></blockquote>

Currently it consists of two features:

- PushPipe, a drop in replacement for the async pipe
- Let directive, an enhancement/alternative to ngIf for binding observable values

### PushPipe

The PushPipe is a drop in replacement for the async pipe. **It triggers change detection** in a zone-less context or triggers `markForCheck` like the async pipe in a zone context.

#### Usage

Replace the async pipe:

```html
{{ count$ | async }}
```

with the ngrx PushPipe:

```html
{{ count$ | ngrxPush }}
```

#### Example

[Here is a Stackblitz example](https://stackblitz.com/edit/blog-pushpipe-example?file=src/app/app.module.ts) with the counter and the PushPipe. Try it out and replace the ngrxPush with async to see how it affects change detection. Also check the [PushPipe documentation](https://github.com/ngrx/platform/blob/680f77fbe38c8086f9684f9033d7722b14a78025/projects/ngrx.io/content/guide/component/push.md) for more examples.

### Let Directive

Another great addition to make it easier to build reactive Angular components is the let-directive.

The let directive is similar to \*ngIf but handles 0 values and supports zone-less the same way the PushPipe does. That means it also triggers change detection when a new value is emitted.

The let-directive does not provide the show/hide funtionality which is imho a good design decision. The let-directive binds to observable values and the ngIf can then be used for the show/hide logic. It's a nice seperation of concerns.

#### Usage

Replace the \*ngIf:

```html
<div *ngIf="count$ | async as count">Count is {{ count }}</div>
```

width \*ngrxLet:

```html
<div *ngrxLet="count$ as count">Count is {{ count }}</div>
```

#### Example

[Here is a Stackblitz example](https://stackblitz.com/edit/blog-pushpipe-example?file=src/app/app.module.ts) with the counter and the let directive. Try it out and replace the ngrxLet with ngIf to see how it affects change detection. Also check the [Let directive documentation](https://github.com/ngrx/platform/blob/680f77fbe38c8086f9684f9033d7722b14a78025/projects/ngrx.io/content/guide/component/let.md) for more examples.

### How PushPipe and the let-directive improve performance?

PushPipe and the let-directive improve performance in two ways:

- Only trigger change detection when a new observable value is emitted
- Trigger change detection only for the component and its children

## Should I now rewrite my code? ❓

Short answer: **Keep Zone.js for now but start using PushPipe and let-directive**

What I showed you in the examples is a zone-less full reactive Angular example. You don't have to go zone-less to make your application more reactive. Let's look at the different motivations behind using ngrx/component.

### Motivation "Reactive Angular"

If you don't have any problems with Zone.js or performance I would keep Zone.js turned on. Focus on writing reactive code. Ngrx/component makes it easier with features like the let-directive.

### Motivation "Zone-less Angular"

You want to get rid of Zone.js and improve performance by only rerendering the current component and its children. A good use case would be Angular Elements. It would simplify the usage of Angular Elements and reduce the bundle size. Ngrx/component is the easiest way to go Zone-less. Only replace the async pipe with the new PushPipe.

🧨 If you turn off Zone.js, some 3rd party libraries might not work anymore. For example, Angular Material select doesn't work out of the box without Zone.js. Try it out and disable Zone.js [here](https://stackblitz.com/angular/lymrvyjbndk?file=src%2Fmain.ts).

### ✨ Start using PushPipe and the let-directive

👉 PushPipe and the let directive are not released yet (as of 23 March 2020). I will update this post after the release.

Since both, PushPipe and let-directive, work with Zone.js enabled you can **use them as a drop in replacement today**. When you ever decide to turn off Zone.js it just works (which is not the case with the async pipe).

The let-directive is also more than just a zone-less ngIf. It seperates the show/hide functionality from binding to observable values.

## Be ready for a reactive (zone-less) future 👩‍🚀

Angular makes it easy to write reactive code. Default libraries like the router and the http client provide observables. Ngrx builds on observables. With ngrx/component it gets even easier to write full reactive code. Full reactive code makes it also much easier to know when to trigger change detection and to write zone-less code.

If you are a developer, embrace RxJS and write your code in a reactive way. It will make it easier for you to use new features like the PushPipe.

If you are a 3rd party library maintainer make sure your library works in a zone-less environment.

If you liked the article 🙌, spread the word and [follow me on Twitter](https://twitter.com/KohlerChristian) for more posts on Angular and web technologies.

Huge thanks to [Michael Hladky](https://twitter.com/Michael_Hladky) for his inputs and reviews, and the work he put into ngrx/component.

Did you find typos 🤓? Please help improve the blogpost and open an issue [here](https://github.com/ChristianKohler/homepage)

## Resources 📚

- [@ngrx/component roadmap](https://github.com/ngrx/platform/issues/2441)
- [Design Doc - Coalescing of Change Detection - HackMD](https://hackmd.io/42oAMrzYReizA65AwQ7ZlQ)
- [Design Doc - Push Pipe - HackMD](https://hackmd.io/Uus0vFu3RmWRVGgmtzuUWQ?view)
- [Design Doc - Let Directive - HackMD](https://hackmd.io/8_3rp0A7RweSYJiulsifbQ?view)
- [Ngrx component setup by BioPhoton](https://github.com/ngrx/platform/pull/2046)
- [GitHub - ngrx/component-builds: @ngrx/component nightly builds](https://github.com/ngrx/component-builds)
- [platform/let.md](https://github.com/ngrx/platform/blob/680f77fbe38c8086f9684f9033d7722b14a78025/projects/ngrx.io/content/guide/component/let.md)
- [platform/push.md](https://github.com/ngrx/platform/blob/680f77fbe38c8086f9684f9033d7722b14a78025/projects/ngrx.io/content/guide/component/push.md)
