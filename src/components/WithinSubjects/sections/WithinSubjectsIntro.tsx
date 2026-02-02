export default function WithinSubjectsIntro() {
  return (
    <div className="section-intro">
      <h2>Same Subjects, Different Conditions</h2>

      <p className="intro-text">
        In the previous modules, we've analyzed <em>between-subjects</em> designs where
        different groups of participants receive different treatments. But there's an
        alternative approach: measure the <strong>same</strong> subjects under multiple
        conditions. This is called a <em>within-subjects</em> or <em>repeated measures</em> design.
      </p>

      <h3>The Stroop Task</h3>

      <p className="intro-text">
        Consider one of psychology's most reliable effects. In the Stroop task, participants
        name the <em>ink color</em> of color words. When the word matches its ink color
        (congruent), responding is fast. When they don't match (incongruent), people slow down.
      </p>

      <div className="stroop-example">
        <div className="stroop-condition congruent">
          <h5>Congruent</h5>
          <div className="stroop-word red">RED</div>
          <div className="response">Say "red" → Fast!</div>
        </div>
        <div className="stroop-condition incongruent">
          <h5>Incongruent</h5>
          <div className="stroop-word blue">RED</div>
          <div className="response">Say "blue" → Slow!</div>
        </div>
      </div>

      <p className="intro-text">
        Here's the key: each participant experiences <strong>both</strong> conditions. We
        measure the same person's response time for congruent trials and for incongruent
        trials. This means every participant provides data for every condition.
      </p>

      <h3>Why Use Within-Subjects Designs?</h3>

      <p className="intro-text">
        Within-subjects designs have a major statistical advantage. In between-subjects
        designs, people differ in countless ways—some are naturally fast, others slow;
        some are more attentive, others less. These individual differences add noise to
        our data, making it harder to detect treatment effects.
      </p>

      <p className="intro-text">
        But in within-subjects designs, each person serves as their own control. When we
        compare a person's performance across conditions, their baseline characteristics
        cancel out. We're not asking "Is Group A faster than Group B?" but rather
        "Is each person faster in Condition A than Condition B?"
      </p>

      <div className="key-insight">
        <h4>The Core Idea</h4>
        <p>
          In between-subjects designs, individual differences add to error variance—they're
          part of the noise we can't explain. In within-subjects designs, we can
          <strong> identify and remove</strong> this variance, leaving a cleaner estimate
          of the treatment effect. This typically gives us more statistical power to
          detect real effects.
        </p>
      </div>

      <h3>What's Coming</h3>

      <p className="intro-text">
        In the sections that follow, we'll explore:
      </p>

      <ul className="intro-text" style={{ lineHeight: 2 }}>
        <li>Why individual differences are a "problem" in between-subjects designs</li>
        <li>How the paired t-test removes subject variance using difference scores</li>
        <li>How repeated measures ANOVA partitions variance when there are 3+ conditions</li>
        <li>The power advantage of within-subjects designs</li>
      </ul>
    </div>
  );
}
