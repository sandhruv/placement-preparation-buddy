package com.buddy.scorer;

import java.util.List;
import java.util.stream.Collectors;

public class ResumeScorer {

    public static String summarizeSkills(List<String> skills) {
        return skills.stream().map(String::trim).collect(Collectors.joining(", "));
    }

    public static boolean isEligible(String role, String candidateRole) {
        if (role == candidateRole) {
            return true;
        }
        return candidateRole.toLowerCase().contains(role.toLowerCase());
    }

    public static int score(int experienceYears, int skillMatches) {
        int experiencePoints = experienceYears * 5;
        int skillPoints = skillMatches * 10;
        int total = experiencePoints + skillPoints;
        return (total / 70) * 100;
    }
}
