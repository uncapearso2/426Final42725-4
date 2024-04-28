import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Guess, guesses } from '../guesses';
import { httpClientInMemBackendServiceFactory } from 'angular-in-memory-web-api';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-wordle',
  templateUrl: './wordle.component.html',
  styleUrls: ['./wordle.component.css'],
})
/*
Main functionality that needs to be worked on is checking the guesses against the goal word and changing the colors of the boxes accordingly. I already have classes created for the possible states but feel free to do it another way!
Also need to add hint button + paragraph for the chatgpt generated hint to go into
Could also add keyboard functionality and allow the user to enter alpha input + enter + backspace instead of clicking on screen
*/
export class WordleComponent {
  guesses = [...guesses];
  goalword = 'TAKEN'; //initial goalword - will have to be connected with backend dictionary functionality
  currentguess = 1;
  hint_count = 3;

  constructor (private http: HttpClient) 
  {}

  setClasses(id: string) {
    let isEmpty = !document.getElementById(id)?.textContent;
    return {
      empty: isEmpty,
      wrong: false,
      yellow: false,
      green: false,
    };
  }
  enter() {
    //user presses enter button
    for (let i = 1; i < 6; i++) {
      let tempid = 'g' + this.currentguess + 'l' + i + 'p'; //id for PARAGRAPH with letter in it - use textContent to look at value in box
      if (document.getElementById(tempid)?.innerHTML == '') {
        //if ANY paragraphs in the guess are empty - don't do anything/can't submit
        return;
      }
    }

    this.checkGuess();
    this.isSolved();
    this.currentguess += 1;
  }

  reset() {
    this.currentguess = 0;
    for (let i = 1; i <= 6; i++) { // Assuming you have 6 guesses
      for (let j = 1; j <= 5; j++) { // Assuming you have 5 letters per guess
        let tempid = 'g' + i + 'l' + j; // Constructing the ID of each letter box
        let letterElement = document.getElementById(tempid); // Getting the letter box element
        if (letterElement) {
          letterElement.textContent  = '';
          letterElement.classList.remove('green', 'yellow'); // Remove additional classes
        }
      }
    }

    //correctly resets the gameboard but then you cannot type, i think this has
    // to do with setClasses or something, ash you may be better at debugging/doing 
    // this function than me
  }

  getHint() {
    let popup = document.getElementById('hintPopup');

    if (this.hint_count > 0) {
    this.http.get<string>('/hint').subscribe((hint: string) => {
      this.hint_count--; 
  
      // Put what is returned into the hint div class
      if (popup) {
        popup.innerHTML = hint; 
        popup.classList.toggle('show');
      }
    });
  }
  else {
    if (popup) {
      popup.innerHTML = 'You have no more hints remaining.'; 
      popup.classList.toggle('show');
    }
  }
  }

  getGoalWord() {
    this.http.get<string>('/word').subscribe((goalword: string) => {
      this.goalword = goalword; 
    })
    // get word with API call
    // set this.goalword to that call

  }

  backspace() {
    //user presses backspace
    for (let i = 5; i > 0; i--) {
      let temppid = 'g' + this.currentguess + 'l' + i + 'p';
      if (document.getElementById(temppid)?.textContent != '') {
        let child = document.getElementById(temppid)?.childNodes;
        if (child != undefined) {
          document.getElementById(temppid)?.removeChild(child[0]);
        }
        return;
      }
    }
  }
  checkGuess() {
    let wrongloc = Array(5).fill(false);
    let greencount = 0;

    let guess = '';
    for (let i = 1; i < 6; i++) {
      let tempid = 'g' + this.currentguess + 'l' + i + 'p';
      let id = 'g' + this.currentguess + 'l' + i;

      let letterElement = document.getElementById(id);
      let letter = document.getElementById(tempid)?.textContent;
      guess += letter;
      // // let letter_count_map = this.count_letters(this.goalword);
      // if (letter === this.goalword[i - 1]) {
      //   // Subtract 1 from i to match array index
      //   letterElement?.classList.add('green'); // Add green class if guessed correctly
      //   greencount += 1;
    }
    for (let i = 1; i < 6; i++) {
      this.guessColor(guess, i);
    }
    return;

  } //helper function for checking the guesses

  guessColor(guess: String, index: any) {
    let wrongWord = 0;
    let wrongGuess = 0;
    let tempid = 'g' + this.currentguess + 'l' + index + 'p';
    let id = 'g' + this.currentguess + 'l' + index;
    let letterElement = document.getElementById(id);
    let letter = document.getElementById(tempid)?.textContent;
    if (letter === this.goalword[index - 1]) {
      letterElement?.classList.add('green');
      return;
    }
    for (let i = 0; i < guess.length; i++) {
      if (
        this.goalword[i] === guess[index - 1] &&
        guess[i] !== guess[index - 1]
      ) {
        wrongWord++;
      }
      if (i <= index-1) {
        if (
          guess[i] === guess[index - 1] &&
          this.goalword[i] !== guess[index - 1]
        ) {
          wrongGuess++;
        }
      }
      if (i >= index - 1) {
        if (wrongGuess === 0) {
          break;
        }
        if (wrongGuess <= wrongWord) {
          letterElement?.classList.add('yellow');
        }
      }
    }
    return;
  }
  isSolved() {
    let isSolved = true;
    for (let i = 1; i < 6; i++) {
      let id = 'g' + this.currentguess + 'l' + i;
      let letterElement = document.getElementById(id);

      // Check if any letter is not marked as green
      if (!letterElement?.classList.contains('green')) {
        // alert("not green")
        isSolved = false;
        break;
      }
    }
    // isSolved = true; // Return true if all letters are green
    if (isSolved) {
      let popup = document.getElementById('winPopup');
      popup?.classList.toggle('show');
      this.http.put<number>('score', this.currentguess);
      
    } else if (this.currentguess >= 6) {
      // print you have failed wordle message
      // You failed to solve the wordle. Better luck next time!
    }
    return isSolved;
  }

  close(){
    
  }
  buttonClick(button: any) {
    for (let i = 1; i < 6; i++) {
      //for each letter in the current guess
      let tempid = 'g' + this.currentguess + 'l' + i + 'p';
      if (document.getElementById(tempid)?.innerHTML == '') {
        //found an empty box
        document
          .getElementById(tempid)
          ?.appendChild(document.createTextNode(button));
        return;
      }
    }
  }
}
/*
Copyright Google LLC. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at https://angular.io/license
*/
