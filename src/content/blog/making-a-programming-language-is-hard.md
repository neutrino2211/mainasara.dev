---
author: Mainasara Tsowa
pubDatetime: 2024-06-26T22:14:00Z
title: 'Gecko: Making a programming language is hard 😮‍💨'
featured: true
published: true
description: I started working on a programming language 4 years ago
tags:
    - golang
    - gecko
    - projects
---

Seemingly every programmer has a dream, making a programming language. It's not a bad idea, really, making a programming language fueled by your ideas of what makes the 'perfect language' is exciting but... the process is not for the faint at heart.

## Table of contents

## The Idea

I first thought of making a programming language back in 2018 and made something that's compiled to a custom bytecode format

<blockquote class="twitter-tweet" data-dnt="true" align="center"><p lang="en" dir="ltr">Have been playing around with a new programming language idea for the past 3 months and today it got to a point that I could test the compiler with actual code.<br>These are the results.<a href="https://twitter.com/hashtag/Thread?src=hash&amp;ref_src=twsrc%5Etfw">#Thread</a><br><br>Sorry <a href="https://twitter.com/IsaacWoods1234?ref_src=twsrc%5Etfw">@IsaacWoods1234</a> I used the name &quot;gecko&quot; 😅 <a href="https://t.co/GzxrWIMMob">pic.twitter.com/GzxrWIMMob</a></p>&mdash; Mainasara 🇳🇬 (@neutrino2211) <a href="https://twitter.com/neutrino2211/status/1067941123904233473?ref_src=twsrc%5Etfw">November 29, 2018</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

I was very happy and continued to work on it but after a few experiments, I found the bytecode approach a bit much because not only did I have to compile the initial code to the byte code, I also had to write an interpreter for the new bytecode. So I took a break to think more on the project

About 18 months later I came back to it with a new approach, "A better C" (control yourself)

That was the obvious way, surely a programming language that worked like C but had friendly syntax and protections for typing and memory made sense, it made so much sense that it did not occur to me that many other people have had the exact same idea... but we move.

The idea was to have Go-like modules but typescript like type definitions and strong C-interop

```typescript
package main

cimport "stdio.h"

declare func printf (format: string, value: unknown): void

const PI: float = 3.14159

external func main (argc: int, argv: [char]) {
    let PI: float = 3
    const value: float = PI * 2
    const vertices: [4][4][3]int = [
        [
            [10,10,10],
            [20,20,20],
            [30,30,30],
            [40,40,40]
        ],
        [
            [10,10,10],
            [20,20,20],
            [30,30,30],
            [40,40,40]
        ],
        [
            [10,10,10],
            [20,20,20],
            [30,30,30],
            [40,40,40]
        ],
        [
            [10,10,10],
            [20,20,20],
            [30,30,30],
            [40,40,40]
        ]
    ]
    printf("%s\n", value)
}
```

It's nice to have an idea, but what about the implementation? How does this get compiled to something "that worked like C"?

Simple... Just use LLVM

## LLVM Dragon, please let me pass...

If it wasn't obvious with the way I mentioned it, let me do so now, explicitly. LLVM is hard to use, very hard.

To use LLVM, one needs to understand low level concepts like the stack, registers, code sections and more. Luckily I had a bit of experience with ASM and was able to pick up a few concepts but it became obvious that LLVM is a completely different beast (huh, that Dragon makes a bit more sense now)

I began with trying to transpile gecko code into LLIR which makes it relatively easy to compile it into machine code using the LLVM llc program. LLIR though, has a deceptive simplicity. The following LLIR produces a valid program.

```llir
; Declare the string constant as a global constant.
@.str = private unnamed_addr constant [13 x i8] c"hello world\0A\00"

; External declaration of the puts function
declare i32 @puts(ptr nocapture) nounwind

; Definition of main function
define i32 @main() {
  ; Call puts function to write out the string to stdout.
  call i32 @puts(ptr @.str)
  ret i32 0
}
```

When the program is compiled (and linked with LibC), the program runs and prints "hello world"

So I try to compile the code into some LLIR, here's the gecko code and the generated IR

```typescript
package main

declare external variardic func printf(format: string)

let GLOBAL_INT: int = 30

func main (): int {
  let hello: string = &"Another number %d\n"

  printf(&"A number %d\n", 90)
  
  printf(&"A string %s\n", &"HH")

  printf(hello, GLOBAL_INT)

  return GLOBAL_INT
}
```

```llir
@.str.62155066001881480236677007312335 = private global [19 x i8] c"Another number %d\0A\00"
@.str.07706532071200013720435667563218 = private global [13 x i8] c"A number %d\0A\00"
@.str.57386676364818780036674824687336 = private global [13 x i8] c"A string %s\0A\00"
@.str.05610270252163716520553770318821 = private global [3 x i8] c"HH\00"

declare ccc void @printf(i8* %format, ...)

define ccc i64 @main() {
main$main:
	%0 = getelementptr [19 x i8], [19 x i8]* @.str.62155066001881480236677007312335, i8 0
	%1 = getelementptr [13 x i8], [13 x i8]* @.str.07706532071200013720435667563218, i8 0
	call void @printf([13 x i8]* %1, i64 90)
	%2 = getelementptr [13 x i8], [13 x i8]* @.str.57386676364818780036674824687336, i8 0
	%3 = getelementptr [3 x i8], [3 x i8]* @.str.05610270252163716520553770318821, i8 0
	call void @printf([13 x i8]* %2, [3 x i8]* %3)
	call void @printf([19 x i8]* %0, i64 30)
	ret i64 30
}
```

And yes, it runs!!!

![Program Successful Compilation](/assets/gecko/int.gecko-1.png)

With that done, the rest should be easy right?

## Skill Issues

This is where my knowledge tapped out, I can figure out how strings are represented in memory but I already had enough issues figuring out variardic functions exist. So it became very evident very quickly that I am not suited to figure much more out.

Something like... branches.

As of writing this, I still have not figured out how branches are to work as I made a few wrong assumptions about them and the github branch (how poetic) still has ongoing rework.

But what's worse than branches? Arrays!

As I mentioned earlier, llir is deceptively simple.

Given the following C code...

```c
#include <stdio.h>

char* get_hello() {
  char* r = "Hello";
  return r;
}

int main(int argc, char** argv) {
  char* names[3] = {"One", "Two", get_hello()};
  printf("name: %s, arr[0]: %s\n", argv[3], names[1]);
}
```

The following LLIR gets generated

```llir
@.str = private unnamed_addr constant [6 x i8] c"Hello\00", align 1
@.str.1 = private unnamed_addr constant [4 x i8] c"One\00", align 1
@.str.2 = private unnamed_addr constant [4 x i8] c"Two\00", align 1
@.str.3 = private unnamed_addr constant [22 x i8] c"name: %s, arr[0]: %s\0A\00", align 1

; Function Attrs: noinline nounwind optnone ssp uwtable(sync)
define ptr @get_some() #0 {
  %1 = alloca ptr, align 8
  store ptr @.str, ptr %1, align 8
  %2 = load ptr, ptr %1, align 8
  ret ptr %2
}

; Function Attrs: noinline nounwind optnone ssp uwtable(sync)
define i32 @main(i32 noundef %0, ptr noundef %1) #0 {
  %3 = alloca i32, align 4
  %4 = alloca ptr, align 8
  %5 = alloca [3 x ptr], align 8
  store i32 %0, ptr %3, align 4
  store ptr %1, ptr %4, align 8
  %6 = getelementptr inbounds [3 x ptr], ptr %5, i64 0, i64 0
  store ptr @.str.1, ptr %6, align 8
  %7 = getelementptr inbounds ptr, ptr %6, i64 1
  store ptr @.str.2, ptr %7, align 8
  %8 = getelementptr inbounds ptr, ptr %7, i64 1
  %9 = call ptr @get_some()
  store ptr %9, ptr %8, align 8
  %10 = load ptr, ptr %4, align 8
  %11 = getelementptr inbounds ptr, ptr %10, i64 3
  %12 = load ptr, ptr %11, align 8
  %13 = getelementptr inbounds [3 x ptr], ptr %5, i64 0, i64 1
  %14 = load ptr, ptr %13, align 8
  %15 = call i32 (ptr, ...) @printf(ptr noundef @.str.3, ptr noundef %12, ptr noundef %14)
  ret i32 0
}

declare i32 @printf(ptr noundef, ...) #1
```

I tried a lot of ways to generate similar LLIR but there were a lot of errors getting any of it to run/compile properly. This, also as of writing, is currently unresolved.

So, if my attempt to use LLVM is bringing more issues than progress, what can I do at this point?

## The C Backend

Up until this point, gecko has only transpiled to LLIR but since that is becoming a problem, I decided to transpile to C instead. Something I understand and can implement multiple features for, struct-based classes, loops, branches, lists and more.

But the AST and compiler were so heavily expectant on the backend being LLVM that I needed to do a whole rewrite of the interface between the AST, Compiler and whatever does the transpiling.

About a thousand loc later, I managed to move the LLVM implementation into a backend interface but that was just part one. I needed to implement the C backend, and a few hundred more lines of code later, I had a C backend that could use clang/gcc to compile the code into machine code.

With this, I tested classes and C interop.

Given the following gecko code

```typescript
package std.types

declare external variardic func printf(format: string!): int

class String {
  private let _str: string = &""

  public func init(str: string): String* {
    let self: String
    self._str = str
    printf("Init string '%s'\n", str)

    return &self
  }

  public func size(self: String*): int {
    return sizeof(*self)
  }

  func printSelf(self: String*): void // An idea I was experimenting with (methods with no bodies are virtual and need implementing)
}
```

Compiling the code into an object file, it generates the following header file (Gecko code compiled as libraries generate an object file and a corresponding .h file. <gecko/gecko.h> being the little gecko std lib I made) 

```c
//Gecko standard library
#include <gecko/gecko.h>
int printf(const string format,...);
typedef struct {
string _str;
} std__types__String;
std__types__String* std__types__String__init(string str);
int std__types__String__size(std__types__String* self);
void std__types__String__printSelf(std__types__String* self);

```

And by compiling the following C code along with the output object file...

```c
#include "./class.gecko.h"
#include <stdio.h>

void std__types__String__printSelf(std__types__String* str) {
  printf("My string '%s'\n", str->_str);
}

int main() {
  std__types__String* str = std__types__String__init("Hello world");
  str->_str = "Second Hello World";
  int sizeOfString = std__types__String__size(str);

  std__types__String__printSelf(str);
  printf("Size of Gecko String %d\n", sizeOfString);
}
```

It runs!!!

![Classes Example Program Successful Compilation](/assets/gecko/class.gecko-1.png)

## Conclusion

That's where I am. Making a programming language has been an educational but seriously difficult process and all that I've discussed is only in regards to what I have experienced in the language implementation details.

But the bugs... the bugs.. Oh God.

### Golang Nil Errors

Golang has an annoying habit of giving you a gift box with nothing inside and then complaining that the box has nothing inside when you give it back. This inspired me to create a package to have [rust-like errors in Golang](https://github.com/neutrino2211/go-option).

I need to refactor a lot of the code to use this package (plus I called it go-option not go-result).

### Refactoring & Rewrites

I've rewritten this language three times

- Once because I forgot to factor in loops into the AST and compilation until the codebase was spaghetti and needed fixing
- Once I rewrote it into C++ because I thought Go was the problem
- And finally rewrote the code in Go again because I figured out I was the problem

And refactored more than I remember

- Refactored code lexing once
- Refactored transpiling and compiling the code
- Used a custom CLI parsing library I made
- Refactored the CLI parsing into a new library
- Refactored the C++ lexer to use a state machine

### Final Thoughts

Making a programming language is exciting but if you are not in it for the long haul, you can get very demotivated and the passion can drain.

So please, before you start. Learn a bit of how to make a programming language and read what I think people believe is [the unofficial manual](https://craftinginterpreters.com/) on making programming languages.

Oh, and celebrate your little wins! :)

<blockquote class="twitter-tweet" data-dnt="true" align="center"><p lang="en" dir="ltr">It took a year and a lot of frustrations but my hobby programming language has gone from 0 to resolving variables!!!!! 😂 <a href="https://t.co/8bQZeMjfcU">pic.twitter.com/8bQZeMjfcU</a></p>&mdash; Mainasara 🇳🇬 (@neutrino2211) <a href="https://twitter.com/neutrino2211/status/1724224918328414279?ref_src=twsrc%5Etfw">November 14, 2023</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>