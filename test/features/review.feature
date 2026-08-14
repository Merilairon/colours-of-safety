Feature: Review queue

  Background:
    Given I am logged in as a reviewer

  Scenario: Review queue page loads
    Given I open the review queue
    Then I see the heading "Review queue"
