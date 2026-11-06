using EsnApp.Application.Common;
using EsnApp.Application.Identity;
using EsnApp.Domain.Info;
using FluentValidation;
using MediatR;

namespace EsnApp.Application.Info;

public record CreateInfoArticleCommand(
    string Title,
    string Slug,
    string Content,
    string Category,
    string ImagePath,
    IReadOnlyList<string> ExternalLinks) : IRequest<Result<AdminInfoArticleDto>>;

public class CreateInfoArticleCommandValidator : AbstractValidator<CreateInfoArticleCommand>
{
    public CreateInfoArticleCommandValidator()
    {
        RuleFor(c => c.Title).NotEmpty().MaximumLength(200);
        RuleFor(c => c.Slug)
            .NotEmpty()
            .MaximumLength(200)
            .Matches("^[a-z0-9]+(?:-[a-z0-9]+)*$");
        RuleFor(c => c.Content).NotEmpty().MaximumLength(50_000);
        RuleFor(c => c.Category).NotEmpty().MaximumLength(100);
        RuleFor(c => c.ImagePath).NotEmpty().MaximumLength(2000);
        RuleFor(c => c.ExternalLinks)
            .NotNull()
            .Must(links => links is not null && links.Count <= 20);
        RuleForEach(c => c.ExternalLinks)
            .NotEmpty()
            .MaximumLength(2000)
            .Must(link => Uri.TryCreate(link, UriKind.Absolute, out var uri)
                && uri.Scheme is "http" or "https")
            .WithMessage("External links must be absolute HTTP or HTTPS URLs.");
    }
}

public class CreateInfoArticleCommandHandler(IInfoArticleRepository repository, ICurrentUser currentUser)
    : IRequestHandler<CreateInfoArticleCommand, Result<AdminInfoArticleDto>>
{
    public async Task<Result<AdminInfoArticleDto>> Handle(
        CreateInfoArticleCommand request,
        CancellationToken cancellationToken)
    {
        if (await repository.SlugExistsAsync(request.Slug, cancellationToken: cancellationToken))
        {
            return Result.Failure<AdminInfoArticleDto>($"Slug '{request.Slug}' is already in use.");
        }

        var drafts = await repository.GetAdminListAsync(
            InfoArticleStatus.Draft, null, cancellationToken);
        var entity = new InfoArticle
        {
            Title = request.Title.Trim(),
            Slug = request.Slug,
            Content = request.Content,
            Category = request.Category.Trim(),
            ImagePath = request.ImagePath,
            ExternalLinks = [.. request.ExternalLinks],
            CreatedById = currentUser.UserId,
            CreatedByName = currentUser.DisplayName,
            // New articles start as drafts and go on top of the draft list.
            DisplayOrder = drafts.Count == 0 ? 0 : drafts.Min(draft => draft.DisplayOrder) - 1,
        };

        var created = await repository.AddAsync(entity, cancellationToken);

        return Result.Success(AdminInfoArticleDto.FromEntity(created));
    }
}
