package com.buddy;

import com.buddy.scorer.ResumeScorer;

import java.util.List;

public class App {
    public static void main(String[] args) {
        List<String> skills = List.of("Java", "Python", "SQL");
        System.out.println("Skills: " + ResumeScorer.summarizeSkills(skills));

        boolean eligible = ResumeScorer.isEligible("Java Developer", "java developer");
        System.out.println("Eligible: " + eligible);

        int score = ResumeScorer.score(3, 5);
        System.out.println("Score: " + score);
    }
}
